import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	Image,
	Alert,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import Slider from "@react-native-community/slider";
import { crearReporteSchema, CrearReporteInput } from "./reporte.schema";
import { useCrearReporte } from "./reporte.queries";
import { Categoria, FotoFile } from "./reporte.types";
import { useComunidades } from "@/src/features/comunidades/comunidad.queries";
import MapPicker from "@/src/components/Map";
import MapView, { Marker } from "react-native-maps";

const CATEGORIAS = [
	{ label: "BACHES Y PAVIMENTO", value: "INFRAESTRUCTURA", emoji: "🕳️" },
	{ label: "SEÑALIZACIÓN", value: "VIALIDAD", emoji: "🚦" },
	{ label: "BLOQUEOS", value: "BLOQUEOS", emoji: "🚧" },
	{ label: "SEGURIDAD", value: "SEGURIDAD", emoji: "🔒" },
];

export function FormularioReporte() {
	const router = useRouter();
	const { mutate: crear, isPending } = useCrearReporte();

	const [fotos, setFotos] = useState<FotoFile[]>([]);
	const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
		null,
	);
	const [loadingGPS, setLoadingGPS] = useState(false);
	const { data: comunidades } = useComunidades();
	const [mapVisible, setMapVisible] = useState(false);

	const {
		control,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<CrearReporteInput>({
		resolver: zodResolver(crearReporteSchema),
		defaultValues: {
			gravedad: 3,
			categoria: "INFRAESTRUCTURA",
			comunidadId: 1,
		},
	});

	const categoriaActiva = watch("categoria");
	const gravedadActiva = watch("gravedad");

	useEffect(() => {
		obtenerUbicacion();
	}, []);

	async function obtenerUbicacion() {
		setLoadingGPS(true);
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Permiso denegado",
					"Se necesita acceso a la ubicación para crear un reporte.",
				);
				return;
			}
			const loc = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High,
			});
			setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
			setValue("latitud", loc.coords.latitude);
			setValue("longitud", loc.coords.longitude);
		} catch {
			Alert.alert("Error", "No se pudo obtener la ubicación.");
		} finally {
			setLoadingGPS(false);
		}
	}

	async function seleccionarFotos() {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (status !== "granted") {
			Alert.alert("Permiso denegado", "Se necesita acceso a la galería.");
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsMultipleSelection: true,
			quality: 0.7,
		});

		if (!result.canceled) {
			const nuevas = result.assets.map((a, index) => ({
				uri: a.uri,
				name: a.fileName ?? `foto_${Date.now()}_${index}.jpg`,
				type: a.mimeType ?? "image/jpeg",
			}));

			setFotos((prev) => [...prev, ...nuevas].slice(0, 5));
		}
	}

	async function tomarFoto() {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();

		if (status !== "granted") {
			Alert.alert("Permiso denegado");
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			quality: 0.7,
		});

		if (!result.canceled) {
			const asset = result.assets[0];

			setFotos((prev) =>
				[
					...prev,
					{
						uri: asset.uri,
						name: asset.fileName ?? `foto_${Date.now()}.jpg`,
						type: asset.mimeType ?? "image/jpeg",
					},
				].slice(0, 5),
			);
		}
	}

	function eliminarFoto(uri: string) {
		setFotos((prev) => prev.filter((f) => f.uri !== uri));
	}

	const onSubmit = (data: CrearReporteInput) => {
		crear(
			{ ...data, fuente: "APP_MOVIL", fotos },
			{
				onError: (err: any) => {
					const msg =
						err?.response?.data?.error ??
						JSON.stringify(err?.response?.data?.errors ?? "Error desconocido");
					Alert.alert("Error del servidor", msg);
				},
			},
		);
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScrollView
				style={{ flex: 1, backgroundColor: "#f8f9ff" }}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 12,
						paddingHorizontal: 20,
						paddingTop: 52,
						paddingBottom: 12,
						backgroundColor: "#ffffff",
						borderBottomWidth: 1,
						borderBottomColor: "#e2e8f0",
					}}
				>
					<Text
						style={{
							fontSize: 22,
							fontWeight: "900",
							color: "#2563eb",
							letterSpacing: -0.5,
						}}
					>
						IRSU
					</Text>
					<Text style={{ fontSize: 20 }}>🔔</Text>
				</View>

				<View style={{ padding: 20, gap: 16 }}>
					{/* Título */}
					<View>
						<Text style={{ fontSize: 24, fontWeight: "600", color: "#0b1c30" }}>
							Nuevo Reporte
						</Text>
						<Text style={{ fontSize: 14, color: "#737686", marginTop: 4 }}>
							Sigue los pasos para informar de una incidencia ciudadana.
						</Text>
					</View>

					{/* Categoría */}
					<View
						style={{
							backgroundColor: "#ffffff",
							borderRadius: 12,
							padding: 16,
							borderWidth: 1,
							borderColor: "#c3c6d7",
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.06,
							shadowRadius: 12,
							elevation: 2,
						}}
					>
						<Text
							style={{
								fontSize: 14,
								fontWeight: "600",
								color: "#0b1c30",
								marginBottom: 12,
							}}
						>
							Categoría de Incidencia
						</Text>
						<Controller
							control={control}
							name="categoria"
							render={({ field: { onChange, value } }) => (
								<View
									style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
								>
									{CATEGORIAS.map((cat) => {
										const activa = value === cat.value;
										return (
											<TouchableOpacity
												key={cat.value}
												onPress={() => onChange(cat.value)}
												style={{
													width: "47%",
													padding: 16,
													borderRadius: 8,
													borderWidth: activa ? 2 : 1,
													borderColor: activa ? "#004ac6" : "#c3c6d7",
													backgroundColor: activa ? "#eff4ff" : "#ffffff",
													alignItems: "center",
													gap: 4,
												}}
											>
												<Text style={{ fontSize: 28 }}>{cat.emoji}</Text>
												<Text
													style={{
														fontSize: 11,
														fontWeight: "700",
														color: activa ? "#004ac6" : "#434655",
													}}
												>
													{cat.label}
												</Text>
											</TouchableOpacity>
										);
									})}
								</View>
							)}
						/>
					</View>

					{/* Título del reporte */}
					<View
						style={{
							backgroundColor: "#ffffff",
							borderRadius: 12,
							padding: 16,
							borderWidth: 1,
							borderColor: "#c3c6d7",
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.06,
							shadowRadius: 12,
							elevation: 2,
						}}
					>
						<Text
							style={{
								fontSize: 14,
								fontWeight: "600",
								color: "#0b1c30",
								marginBottom: 8,
							}}
						>
							Título
						</Text>
						<Controller
							control={control}
							name="titulo"
							render={({ field: { onChange, value } }) => (
								<TextInput
									onChangeText={onChange}
									value={value}
									placeholder="Ej: Bache profundo en Av. Principal"
									placeholderTextColor="#737686"
									style={{
										borderWidth: 1,
										borderColor: errors.titulo ? "#ba1a1a" : "#c3c6d7",
										borderRadius: 8,
										padding: 12,
										fontSize: 16,
										color: "#0b1c30",
										backgroundColor: "#fff",
									}}
								/>
							)}
						/>
						{errors.titulo && (
							<Text style={{ color: "#ba1a1a", fontSize: 12, marginTop: 4 }}>
								{errors.titulo.message}
							</Text>
						)}
					</View>

					{/* Gravedad */}
					<View
						style={{
							backgroundColor: "#ffffff",
							borderRadius: 12,
							padding: 16,
							borderWidth: 1,
							borderColor: "#c3c6d7",
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.06,
							shadowRadius: 12,
							elevation: 2,
						}}
					>
						<View
							style={{
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: 12,
							}}
						>
							<Text
								style={{ fontSize: 14, fontWeight: "600", color: "#0b1c30" }}
							>
								Gravedad percibida
							</Text>
							<View
								style={{
									backgroundColor: "#fef3c7",
									paddingHorizontal: 10,
									paddingVertical: 4,
									borderRadius: 999,
								}}
							>
								<Text
									style={{ fontSize: 12, fontWeight: "700", color: "#92400e" }}
								>
									NIVEL {gravedadActiva}
								</Text>
							</View>
						</View>
						<Controller
							control={control}
							name="gravedad"
							render={({ field: { onChange, value } }) => (
								<Slider
									minimumValue={1}
									maximumValue={5}
									step={1}
									value={value}
									onValueChange={(v) => onChange(Math.round(v))}
									minimumTrackTintColor="#004ac6"
									maximumTrackTintColor="#c3c6d7"
									thumbTintColor="#004ac6"
								/>
							)}
						/>
						<View
							style={{
								flexDirection: "row",
								justifyContent: "space-between",
								paddingHorizontal: 4,
							}}
						>
							{[1, 2, 3, 4, 5].map((n) => (
								<Text key={n} style={{ fontSize: 12, color: "#737686" }}>
									{n}
								</Text>
							))}
						</View>
					</View>

					{/* Descripción y fotos */}
					<View
						style={{
							backgroundColor: "#ffffff",
							borderRadius: 12,
							padding: 16,
							borderWidth: 1,
							borderColor: "#c3c6d7",
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.06,
							shadowRadius: 12,
							elevation: 2,
							gap: 12,
						}}
					>
						<Text style={{ fontSize: 14, fontWeight: "600", color: "#0b1c30" }}>
							Descripción de los hechos
						</Text>
						<Controller
							control={control}
							name="descripcion"
							render={({ field: { onChange, value } }) => (
								<TextInput
									onChangeText={onChange}
									value={value}
									placeholder="Describe brevemente lo ocurrido..."
									placeholderTextColor="#737686"
									multiline
									numberOfLines={4}
									style={{
										borderWidth: 1,
										borderColor: "#c3c6d7",
										borderRadius: 8,
										padding: 12,
										fontSize: 16,
										color: "#0b1c30",
										backgroundColor: "#fff",
										minHeight: 100,
										textAlignVertical: "top",
									}}
								/>
							)}
						/>

						{/* Fotos seleccionadas */}
						{fotos.length > 0 && (
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								style={{ gap: 8 }}
							>
								<View style={{ flexDirection: "row", gap: 8 }}>
									{fotos.map((foto) => (
										<View key={foto.uri} style={{ position: "relative" }}>
											<Image
												source={{ uri: foto.uri }}
												style={{ width: 80, height: 80, borderRadius: 8 }}
												resizeMode="cover"
											/>

											<TouchableOpacity
												onPress={() => eliminarFoto(foto.uri)}
												style={{
													position: "absolute",
													top: -4,
													right: -4,
													backgroundColor: "#ba1a1a",
													borderRadius: 999,
													width: 20,
													height: 20,
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												<Text
													style={{
														color: "#fff",
														fontSize: 10,
														fontWeight: "700",
													}}
												>
													✕
												</Text>
											</TouchableOpacity>
										</View>
									))}
								</View>
							</ScrollView>
						)}

						{/* Botones de fotos */}
						<View style={{ flexDirection: "row", gap: 8 }}>
							<TouchableOpacity
								onPress={tomarFoto}
								style={{
									flex: 1,
									padding: 14,
									borderWidth: 2,
									borderStyle: "dashed",
									borderColor: "#c3c6d7",
									borderRadius: 8,
									alignItems: "center",
									flexDirection: "row",
									justifyContent: "center",
									gap: 6,
								}}
							>
								<Text style={{ fontSize: 16 }}>📷</Text>
								<Text
									style={{ fontSize: 13, fontWeight: "600", color: "#737686" }}
								>
									Cámara
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={seleccionarFotos}
								style={{
									flex: 1,
									padding: 14,
									borderWidth: 2,
									borderStyle: "dashed",
									borderColor: "#c3c6d7",
									borderRadius: 8,
									alignItems: "center",
									flexDirection: "row",
									justifyContent: "center",
									gap: 6,
								}}
							>
								<Text style={{ fontSize: 16 }}>🖼️</Text>
								<Text
									style={{ fontSize: 13, fontWeight: "600", color: "#737686" }}
								>
									Galería
								</Text>
							</TouchableOpacity>
						</View>
					</View>

					<View
						style={{
							backgroundColor: "#fff",
							borderRadius: 12,
							padding: 16,
							borderWidth: 1,
							borderColor: "#c3c6d7",
							gap: 8,
						}}
					>
						<Text style={{ fontSize: 14, fontWeight: "600", color: "#0b1c30" }}>
							Comunidad
						</Text>
						<Controller
							control={control}
							name="comunidadId"
							render={({ field: { onChange, value } }) => (
								<View
									style={{ gap: 8, flexDirection: "row", flexWrap: "wrap" }}
								>
									{(comunidades?.data ?? []).map((c) => (
										<TouchableOpacity
											key={c.id}
											onPress={() => onChange(c.id)}
											style={{
												paddingHorizontal: 12,
												paddingVertical: 8,
												borderRadius: 8,
												borderWidth: value === c.id ? 2 : 1,
												borderColor: value === c.id ? "#004ac6" : "#c3c6d7",
												backgroundColor: value === c.id ? "#eff4ff" : "#fff",
											}}
										>
											<Text
												style={{
													fontSize: 13,
													color: value === c.id ? "#004ac6" : "#434655",
												}}
											>
												{c.nombre}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							)}
						/>
						{errors.comunidadId && (
							<Text style={{ color: "#ba1a1a", fontSize: 12 }}>
								Selecciona una comunidad
							</Text>
						)}
					</View>

					{/* Ubicación */}
					<View
						style={{
							backgroundColor: "#ffffff",
							borderRadius: 12,
							padding: 16,
							borderWidth: 1,
							borderColor: "#c3c6d7",
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.06,
							shadowRadius: 12,
							elevation: 2,
						}}
					>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
								marginBottom: 12,
							}}
						>
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: 6,
								}}
							>
								<Text style={{ fontSize: 16 }}>📍</Text>

								<Text
									style={{
										fontSize: 14,
										fontWeight: "600",
										color: "#0b1c30",
									}}
								>
									Confirmar Ubicación
								</Text>
							</View>

							<TouchableOpacity
								onPress={obtenerUbicacion}
								style={{
									backgroundColor: "#eff4ff",
									paddingHorizontal: 10,
									paddingVertical: 6,
									borderRadius: 8,
								}}
							>
								<Text
									style={{
										fontSize: 12,
										fontWeight: "600",
										color: "#004ac6",
									}}
								>
									Mi ubicación
								</Text>
							</TouchableOpacity>
						</View>

						{/* Vista previa mapa */}
						<TouchableOpacity
							activeOpacity={0.9}
							onPress={() => setMapVisible(true)}
							style={{
								height: 220,
								borderRadius: 12,
								overflow: "hidden",
								borderWidth: 1,
								borderColor: "#c3c6d7",
								backgroundColor: "#e5eeff",
							}}
						>
							{loadingGPS ? (
								<View
									style={{
										flex: 1,
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<ActivityIndicator color="#004ac6" />
								</View>
							) : location ? (
								<>
									<MapView
										style={{ flex: 1 }}
										pointerEvents="none"
										region={{
											latitude: location.lat,
											longitude: location.lng,
											latitudeDelta: 0.005,
											longitudeDelta: 0.005,
										}}
									>
										<Marker
											coordinate={{
												latitude: location.lat,
												longitude: location.lng,
											}}
										/>
									</MapView>

									<View
										style={{
											position: "absolute",
											bottom: 10,
											left: 10,
											right: 10,
											backgroundColor: "rgba(255,255,255,0.92)",
											padding: 10,
											borderRadius: 10,
										}}
									>
										<Text
											style={{
												fontSize: 12,
												fontWeight: "700",
												color: "#004ac6",
											}}
										>
											{location.lat.toFixed(5)}, {location.lng.toFixed(5)}
										</Text>

										<Text
											style={{
												fontSize: 11,
												color: "#737686",
												marginTop: 2,
											}}
										>
											Toca para ajustar manualmente
										</Text>
									</View>
								</>
							) : (
								<View
									style={{
										flex: 1,
										alignItems: "center",
										justifyContent: "center",
										gap: 6,
									}}
								>
									<Text style={{ fontSize: 36 }}>🗺️</Text>

									<Text
										style={{
											fontSize: 12,
											color: "#737686",
										}}
									>
										Toca para seleccionar ubicación
									</Text>
								</View>
							)}
						</TouchableOpacity>

						<Text
							style={{
								fontSize: 12,
								color: "#737686",
								marginTop: 8,
							}}
						>
							ℹ️ Puedes mover el mapa para ajustar la ubicación exacta.
						</Text>
					</View>

					{/* Botón enviar */}
					<TouchableOpacity
						onPress={handleSubmit(onSubmit)}
						disabled={isPending || !location}
						style={{
							height: 56,
							backgroundColor: isPending || !location ? "#b4c5ff" : "#004ac6",
							borderRadius: 12,
							alignItems: "center",
							justifyContent: "center",
							flexDirection: "row",
							gap: 8,
							shadowColor: "#004ac6",
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.25,
							shadowRadius: 8,
							elevation: 4,
						}}
					>
						{isPending ? (
							<ActivityIndicator color="#fff" />
						) : (
							<>
								<Text
									style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}
								>
									Enviar Reporte
								</Text>
								<Text style={{ fontSize: 18 }}>📤</Text>
							</>
						)}
					</TouchableOpacity>

					<Text
						style={{
							textAlign: "center",
							fontSize: 12,
							color: "#737686",
							paddingHorizontal: 16,
							paddingBottom: 40,
						}}
					>
						Al enviar este reporte, confirmas que la información proporcionada
						es verídica y autorizas su gestión ciudadana.
					</Text>
				</View>
			</ScrollView>
			<MapPicker
				visible={mapVisible}
				initialLocation={location}
				onClose={() => setMapVisible(false)}
				onSelectLocation={(coords) => {
					setLocation(coords);

					setValue("latitud", coords.lat);

					setValue("longitud", coords.lng);
				}}
			/>
		</KeyboardAvoidingView>
	);
}
