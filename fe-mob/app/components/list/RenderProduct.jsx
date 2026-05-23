import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Card, Checkbox, IconButton, Chip } from 'react-native-paper';

const formatDate = (isoString) => {
	const date = new Date(isoString);
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

const getNutriscoreColor = (grade) => {
	const colors = {
		a: '#038141',
		b: '#85BB2F',
		c: '#FECB02',
		d: '#EE8100',
		e: '#E63E11',
	};
	return colors[grade?.toLowerCase()] || '#757575';
};

export default function RenderProduct({
	item,
	selected,
	onPress,
	onToggleSelection,
	onDelete,
}) {
	return (
		<Card
			style={[styles.productCard, selected && styles.selectedCard]}
			onPress={onPress}
			onLongPress={onToggleSelection}
		>
			<View style={styles.cardContent}>
				<Checkbox
					status={selected ? 'checked' : 'unchecked'}
					onPress={onToggleSelection}
					color="#93BFC7"
				/>

				{item.image ? (
					<Image source={{ uri: item.image }} style={styles.productImage} />
				) : (
					<View style={styles.placeholderImage}>
						<Text style={styles.placeholderText}>No Image</Text>
					</View>
				)}

				<View style={styles.productInfo}>
					<Text style={styles.productName} numberOfLines={2}>
						{item.name}
					</Text>
					{item.brand && (
						<Text style={styles.brandText} numberOfLines={1}>
							{item.brand}
						</Text>
					)}
					<Text style={styles.dateText}>{formatDate(item.scannedAt)}</Text>
					<Text style={styles.barcodeText}>#{item.barcode}</Text>
				</View>

				<View style={styles.rightSection}>
					{item.nutriscore && (
						<Chip
							style={[
								styles.nutriscoreChip,
								{ backgroundColor: getNutriscoreColor(item.nutriscore) },
							]}
							textStyle={styles.nutriscoreText}
						>
							{item.nutriscore.toUpperCase()}
						</Chip>
					)}
					<IconButton
						icon="delete-outline"
						size={20}
						iconColor="#E63E11"
						onPress={onDelete}
					/>
				</View>
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	productCard: {
		marginBottom: 10,
		backgroundColor: 'rgba(253, 255, 255, 0.95)',
		borderRadius: 5,
		elevation: 2,
	},
	selectedCard: {
		backgroundColor: 'rgba(232, 245, 240, 0.95)',
		borderWidth: 2,
		borderColor: '#93BFC7',
	},
	cardContent: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
	},
	productImage: {
		width: 60,
		height: 60,
		borderRadius: 8,
		marginRight: 12,
	},
	placeholderImage: {
		width: 60,
		height: 60,
		borderRadius: 8,
		marginRight: 12,
		backgroundColor: '#e0e0e0ff',
		justifyContent: 'center',
		alignItems: 'center',
	},
	placeholderText: {
		fontSize: 10,
		color: '#757575',
	},
	productInfo: {
		flex: 1,
	},
	productName: {
		fontSize: 16,
		fontWeight: '600',
		color: '#1F2937',
	},
	brandText: {
		fontSize: 13,
		color: '#757575',
		marginTop: 2,
	},
	dateText: {
		fontSize: 12,
		color: '#9e9e9e',
		marginTop: 4,
	},
	barcodeText: {
		fontSize: 11,
		color: '#bdbdbd',
		marginTop: 2,
	},
	rightSection: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	nutriscoreChip: {
		marginBottom: 4,
	},
	nutriscoreText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 12,
	},
});
