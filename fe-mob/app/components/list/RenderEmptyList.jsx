import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, Button } from 'react-native-paper';

export default function RenderEmptyList({ onScanPress }) {
	return (
		<View style={styles.emptyContainer}>
			<Ionicons name="scan-sharp" size={64} color="#5ac09eff" style={styles.emptyIcon} />
			<Text style={styles.emptyTitle}>No Products Scanned</Text>
			<Text style={styles.emptySubtitle}>
				Your scanned products will appear here.
			</Text>
			<Button
				mode="contained"
				onPress={onScanPress}
				style={styles.scanButton}
				buttonColor="#5ec1a0ff"
				textColor="#fff"
			>
				Scan a Product
			</Button>
		</View>
	);
}

const styles = StyleSheet.create({
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 32,
	},
	emptyIcon: {
		fontSize: 64,
		marginBottom: 16,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#1F2937',
		marginBottom: 8,
	},
	emptySubtitle: {
		fontSize: 14,
		color: '#757575',
		textAlign: 'center',
		marginBottom: 24,
	},
	scanButton: {
		borderRadius: 10,
	},
});
