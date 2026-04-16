import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useProductAPI } from '@/hooks/useProductAPI';
import { useFoodImageAPI } from '@/hooks/useFoodImageAPI';
import { useProductHistory } from '@/hooks/useProductHistory';
import { useAuth } from '@/hooks/auth-context';
import { getUserProfile } from '@/lib/appwriteDb';

const normalizeBarcode = (value) => String(value || '').replace(/\D/g, '');

const truthy = (value) => {
	if (typeof value === 'boolean') return value;
	const normalized = String(value || '').trim().toLowerCase();
	return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const isExpiredOrSpoiledFood = (foodData) => {
	if (!foodData) return false;

	const explicitUnsafe = [
		foodData.is_expired_or_spoiled,
		foodData.expired_or_spoiled,
		foodData.spoilage_detected,
		foodData.is_spoiled,
		foodData.is_expired,
	].some(truthy);

	const statusValue = String(foodData.food_safety_status || foodData.food_condition || '').toLowerCase();
	const statusUnsafe = ['unsafe', 'expired', 'spoiled', 'rotten'].some((token) =>
		statusValue.includes(token)
	);

	const concernText = Array.isArray(foodData.potential_concerns)
		? foodData.potential_concerns.join(' ')
		: '';

	const textBlob = [
		foodData.food_safety_note,
		foodData.description,
		foodData.preparation_notes,
		concernText,
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();

	const textUnsafe = /(expired|spoil(?:ed|age)?|rotten|mold|mould|rancid|contaminated|unsafe\s+to\s+eat|not\s+safe\s+to\s+eat)/i.test(
		textBlob
	);

	return explicitUnsafe || statusUnsafe || textUnsafe;
};

const getSpoilageMessage = (foodData) => {
	const note = String(foodData?.food_safety_note || '').trim();
	if (note) return note;
	return 'This food appears expired or spoiled and may be unsafe to consume. Please scan a fresh item.';
};

const extractFoodItems = (foodData) => {
	if (Array.isArray(foodData)) {
		return foodData.filter((item) => item && typeof item === 'object');
	}

	if (!foodData || typeof foodData !== 'object') {
		return [];
	}

	const listKeys = ['food_items', 'foods', 'detected_foods', 'identified_foods', 'items'];
	for (const key of listKeys) {
		if (Array.isArray(foodData[key])) {
			return foodData[key].filter((item) => item && typeof item === 'object');
		}
	}

	return [foodData];
};

export const useScan = () => {
	const [permission, requestPermission] = useCameraPermissions();
	const [scanned, setScanned] = useState(false);
	const [cameraReady, setCameraReady] = useState(false);
	const [torchEnabled, setTorchEnabled] = useState(false);
	const [scanMode, setScanMode] = useState('barcode');
	const [capturedImage, setCapturedImage] = useState(null);
	const [finalizing, setFinalizing] = useState(false);
	const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
	const [pendingNavigation, setPendingNavigation] = useState(null);
	const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
	const [barcodeFinalizing, setBarcodeFinalizing] = useState(false);
	const [disambiguationData, setDisambiguationData] = useState(null);
	const [showDisambiguationModal, setShowDisambiguationModal] = useState(false);

	const cameraRef = useRef(null);
	const lastBarcodeRef = useRef(null);
	const isBarcodeFetchInProgressRef = useRef(false);

	const { fetchProduct, loading: productLoading } = useProductAPI();
	const { analyzeFoodImage, confirmFoodName, loading: foodLoading } = useFoodImageAPI();
	const { addProduct, addFoodItem } = useProductHistory();
	const { user } = useAuth();
	const router = useRouter();
	const isFocused = useIsFocused();

	const loading = productLoading || foodLoading;
	const isCameraActive = isFocused && cameraReady && !capturedImage;

	const showError = useCallback((title, message) => {
		setErrorModal({ visible: true, title, message });
	}, []);

	const hideError = useCallback(() => {
		setErrorModal({ visible: false, title: '', message: '' });
		setCapturedImage(null);
		setScanned(false);
		setBarcodeFinalizing(false);
	}, []);

	useFocusEffect(
		useCallback(() => {
			setScanned(false);
			setTorchEnabled(false);
			setCameraReady(false);
			setCapturedImage(null);
			setFinalizing(false);
			setShowDisclaimerModal(false);
			setPendingNavigation(null);
			setErrorModal({ visible: false, title: '', message: '' });
			setDisambiguationData(null);
			setShowDisambiguationModal(false);
			lastBarcodeRef.current = null;
			isBarcodeFetchInProgressRef.current = false;

			const timer = setTimeout(() => {
				setCameraReady(true);
			}, 100);

			return () => {
				clearTimeout(timer);
				setTorchEnabled(false);
				setCameraReady(false);
				setFinalizing(false);
				isBarcodeFetchInProgressRef.current = false;
			};
		}, [])
	);

	const proceedAfterIdentification = useCallback(
		async (foodData, imageUri, options = {}) => {
			const { skipReminderModal = false } = options;

			setFinalizing(true);
			await addFoodItem(foodData, imageUri);
			const navigationTarget = {
				pathname: '/food-detail',
				params: { foodData: JSON.stringify(foodData) },
			};

			if (skipReminderModal) {
				setShowDisclaimerModal(false);
				setPendingNavigation(null);
				router.push(navigationTarget);
				return;
			}

			setPendingNavigation(navigationTarget);
			setShowDisclaimerModal(true);
		},
		[addFoodItem, router]
	);

	const analyzePhoto = useCallback(
		async (base64Image, imageUri = null) => {
			let userProfile = null;

			if (user) {
				try {
					userProfile = await getUserProfile(user.$id);
				} catch {
					console.log('Could not fetch user profile');
				}
			}

			const foodData = await analyzeFoodImage(base64Image, userProfile);
			const foodItems = extractFoodItems(foodData);

			if (foodItems.length > 0) {
				const unsafeItem = foodItems.find((item) => isExpiredOrSpoiledFood(item));
				if (unsafeItem) {
					showError('Food Safety Warning', getSpoilageMessage(unsafeItem));
					return;
				}

				const identifiedItems = foodItems.filter((item) => item && item.identified !== false);

				if (identifiedItems.length > 1) {
					const multiFoodPayload = {
						...(foodData && typeof foodData === 'object' ? foodData : {}),
						items: identifiedItems,
						food_name: `${identifiedItems.length} foods detected`,
						name: `${identifiedItems.length} foods detected`,
					};
					await proceedAfterIdentification(multiFoodPayload, imageUri);
					return;
				}

				if (identifiedItems.length === 1) {
					const singleItem = identifiedItems[0];
					const confidence = String(singleItem.confidence || '').toLowerCase();
					const requiresConfirmation =
						singleItem.disambiguation_needed || confidence === 'medium' || confidence === 'low';

					if (requiresConfirmation) {
						setDisambiguationData({ foodData: singleItem, imageUri });
						setShowDisambiguationModal(true);
						return;
					}

					await proceedAfterIdentification(singleItem, imageUri);
					return;
				}

				showError(
					'Food Not Recognized',
					foodItems[0]?.description ||
						"We couldn't identify the food in this image. Please try taking a clearer photo."
				);
				return;
			}

			showError('Analysis Failed', 'Failed to analyze the image. Please check your connection and try again.');
		},
		[analyzeFoodImage, proceedAfterIdentification, showError, user]
	);

	const handleBarcodeScanned = useCallback(
		async ({ type, data }) => {
			if (scanMode !== 'barcode' || loading || isBarcodeFetchInProgressRef.current) return;

			const normalizedBarcode = normalizeBarcode(data);
			if (!normalizedBarcode) return;

			if (normalizedBarcode === lastBarcodeRef.current) return;

			lastBarcodeRef.current = normalizedBarcode;
			isBarcodeFetchInProgressRef.current = true;
			setScanned(true);
			setTorchEnabled(false);
			console.log(`Scanned (${type}): ${normalizedBarcode}`);

			try {
				const productData = await fetchProduct(normalizedBarcode);

				if (!productData) {
					showError(
						'Product Not Found',
						'We could not find this product in Open Food Facts or Appwrite.'
					);
					setScanned(false);
					lastBarcodeRef.current = null;
					return;
				}

				setBarcodeFinalizing(true);
				await addProduct(productData, normalizedBarcode);

				setTimeout(() => {
					setBarcodeFinalizing(false);
					router.push({
						pathname: '/product-detail',
						params: {
							barcode: normalizedBarcode,
							productData: JSON.stringify(productData),
						},
					});
				}, 600);
			} catch {
				showError('Scan Error', 'Something went wrong while fetching this barcode. Please try again.');
				setScanned(false);
				lastBarcodeRef.current = null;
			} finally {
				isBarcodeFetchInProgressRef.current = false;
			}
		},
		[addProduct, fetchProduct, loading, router, scanMode, showError]
	);

	const takePicture = useCallback(async () => {
		if (!cameraRef.current) return;

		try {
			const photo = await cameraRef.current.takePictureAsync({
				base64: true,
				quality: 0.5,
			});
			setCapturedImage(photo);
			await analyzePhoto(photo.base64, photo.uri);
		} catch {
			showError('Camera Error', 'Failed to capture the image. Please try again.');
		}
	}, [analyzePhoto, showError]);

	const pickImage = useCallback(async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.7,
			base64: true,
		});

		if (!result.canceled && result.assets[0]) {
			setCapturedImage(result.assets[0]);
			await analyzePhoto(result.assets[0].base64, result.assets[0].uri);
		}
	}, [analyzePhoto]);

	const handleDisambiguationConfirm = useCallback(
		async (resolvedName) => {
			setShowDisambiguationModal(false);
			if (!disambiguationData) return;

			const { foodData, imageUri } = disambiguationData;
			setDisambiguationData(null);

			const confirmedData = await confirmFoodName(foodData, resolvedName);
			const updatedFoodData = confirmedData || {
				...foodData,
				food_name: resolvedName,
				user_corrected_name: true,
			};

			if (isExpiredOrSpoiledFood(updatedFoodData)) {
				showError('Food Safety Warning', getSpoilageMessage(updatedFoodData));
				return;
			}

			await proceedAfterIdentification(updatedFoodData, imageUri, { skipReminderModal: true });
		},
		[confirmFoodName, disambiguationData, proceedAfterIdentification, showError]
	);

	const handleDisambiguationDismiss = useCallback(() => {
		setShowDisambiguationModal(false);
		setDisambiguationData(null);
		setCapturedImage(null);
		setFinalizing(false);
	}, []);

	const onDisclaimerAcknowledge = useCallback(() => {
		setShowDisclaimerModal(false);
		if (pendingNavigation) {
			router.push(pendingNavigation);
		}
	}, [pendingNavigation, router]);

	const toggleScanMode = useCallback(() => {
		setScanMode((prev) => (prev === 'barcode' ? 'food' : 'barcode'));
		setScanned(false);
		setCapturedImage(null);
	}, []);

	return {
		permission,
		requestPermission,
		cameraRef,
		loading,
		scanned,
		torchEnabled,
		scanMode,
		capturedImage,
		finalizing,
		showDisclaimerModal,
		errorModal,
		barcodeFinalizing,
		disambiguationData,
		showDisambiguationModal,
		isCameraActive,
		hideError,
		handleBarcodeScanned,
		takePicture,
		pickImage,
		handleDisambiguationConfirm,
		handleDisambiguationDismiss,
		toggleScanMode,
		setTorchEnabled,
		onDisclaimerAcknowledge,
	};
};
