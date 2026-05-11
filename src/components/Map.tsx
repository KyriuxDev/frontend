import { useEffect, useState } from "react";

import {
	Modal,
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
} from "react-native";

import MapView, { Region } from "react-native-maps";

import * as Location from "expo-location";

type Props = {
	visible: boolean;

	onClose: () => void;

	onSelectLocation: (coords: { lat: number; lng: number }) => void;

	initialLocation?: {
		lat: number;
		lng: number;
	} | null;
};

export default function MapPicker({
	visible,
	onClose,
	onSelectLocation,
	initialLocation,
}: Props) {
	const [region, setRegion] = useState<Region>({
		latitude: initialLocation?.lat ?? 17.0732,

		longitude: initialLocation?.lng ?? -96.7266,

		latitudeDelta: 0.01,

		longitudeDelta: 0.01,
	});

	useEffect(() => {
		obtenerUbicacion();
	}, []);

	async function obtenerUbicacion() {
		const { status } = await Location.requestForegroundPermissionsAsync();

		if (status !== "granted") return;

		const loc = await Location.getCurrentPositionAsync({
			accuracy: Location.Accuracy.High,
		});

		setRegion({
			latitude: loc.coords.latitude,

			longitude: loc.coords.longitude,

			latitudeDelta: 0.01,

			longitudeDelta: 0.01,
		});
	}

	function confirmarUbicacion() {
		onSelectLocation({
			lat: region.latitude,

			lng: region.longitude,
		});

		onClose();
	}

	return (
		<Modal visible={visible} animationType="slide">
			<View style={{ flex: 1 }}>
				<MapView
					style={{ flex: 1 }}
					region={region}
					showsUserLocation
					onRegionChangeComplete={(r) => {
						setRegion(r);
					}}
				/>

				{/* PIN FIJO */}
				<View pointerEvents="none" style={styles.pinContainer}>
					<Text style={styles.pin}>📍</Text>
				</View>

				{/* Coordenadas */}
				<View style={styles.coordsBox}>
					<Text style={styles.coordsText}>
						Lat: {region.latitude.toFixed(6)}
					</Text>

					<Text style={styles.coordsText}>
						Lng: {region.longitude.toFixed(6)}
					</Text>
				</View>

				{/* Botones */}
				<View style={styles.footer}>
					<TouchableOpacity style={styles.cancelButton} onPress={onClose}>
						<Text style={styles.buttonText}>Cancelar</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.confirmButton}
						onPress={confirmarUbicacion}
					>
						<Text style={styles.buttonText}>Confirmar</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	pinContainer: {
		position: "absolute",

		top: "50%",

		left: "50%",

		marginLeft: -20,

		marginTop: -40,
	},

	pin: {
		fontSize: 40,
	},

	coordsBox: {
		position: "absolute",

		top: 60,

		alignSelf: "center",

		backgroundColor: "white",

		paddingHorizontal: 14,

		paddingVertical: 10,

		borderRadius: 12,

		elevation: 4,
	},

	coordsText: {
		fontSize: 12,

		fontWeight: "600",
	},

	footer: {
		position: "absolute",

		bottom: 40,

		left: 20,

		right: 20,

		flexDirection: "row",

		gap: 12,
	},

	cancelButton: {
		flex: 1,

		backgroundColor: "#999",

		padding: 16,

		borderRadius: 12,

		alignItems: "center",
	},

	confirmButton: {
		flex: 1,

		backgroundColor: "#004ac6",

		padding: 16,

		borderRadius: 12,

		alignItems: "center",
	},

	buttonText: {
		color: "#fff",

		fontWeight: "700",
	},
});