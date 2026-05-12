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
import { useComunidades } from "@/src/features/comunidades/comunidad.queries";
import MapPicker from "@/src/components/Map";
import { MapView, Marker } from "@/src/components/MapViewWrapper";
import { api } from "@/src/lib/axios";
import { Ionicons } from '@expo/vector-icons';

const CATEGORIAS = [
  { label: 'BACHES Y PAVIMENTO', value: 'INFRAESTRUCTURA', icon: 'construct-outline' },
  { label: 'SEÑALIZACIÓN',       value: 'VIALIDAD',        icon: 'flag-outline'      },
  { label: 'BLOQUEOS',           value: 'BLOQUEOS',        icon: 'alert-circle-outline' },
  { label: 'SEGURIDAD',          value: 'SEGURIDAD',       icon: 'shield-outline'    },
];

export function FormularioReporte() {
	const router = useRouter();
	const { mutateAsync: crearAsync, isPending } = useCrearReporte();
	const [uploadingFotos, setUploadingFotos] = useState(false);

	const [fotos, setFotos] = useState<string[]>([]);
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
			const uris = result.assets.map((a) => a.uri);
			setFotos((prev) => [...prev, ...uris].slice(0, 5));
		}
	}

	async function tomarFoto() {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permiso denegado", "Se necesita acceso a la cámara.");
			return;
		}
		const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
		if (!result.canceled) {
			setFotos((prev) => [...prev, result.assets[0].uri].slice(0, 5));
		}
	}

	function eliminarFoto(uri: string) {
		setFotos((prev) => prev.filter((f) => f !== uri));
	}

	async function subirFotos(reporteId: number, uris: string[]) {
		const formData = new FormData();

		uris.forEach((uri, index) => {
			const ext  = uri.split(".").pop()?.toLowerCase() ?? "jpg";
			const mime =
			ext === "png"  ? "image/png"  :
			ext === "webp" ? "image/webp" : "image/jpeg";

			formData.append("fotos", {
			uri,
			name: `foto-${index}.${ext}`,
			type: mime,
			} as any);
		});

		// Obtener token (puede ser null si es anónimo)
		const token =
			Platform.OS === "web"
			? localStorage.getItem("access_token")
			: await (await import("expo-secure-store")).getItemAsync("access_token");

		const baseURL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

		const response = await fetch(
			`${baseURL}/reportes/${reporteId}/fotos`,
			{
			method: "POST",
			headers: token
				? { Authorization: `Bearer ${token}` }
				: {},          // sin Content-Type — fetch pone el boundary solo
			body: formData,
			}
		);

		if (!response.ok) {
			const body = await response.json().catch(() => ({}));
			throw new Error(body?.error ?? `Error ${response.status}`);
		}

		return response.json();
		}

	const onSubmit = async (data: CrearReporteInput) => {
		try {
			const reporte = await crearAsync({ ...data, fuente: "APP_MOVIL" });

			if (fotos.length > 0) {
			setUploadingFotos(true);
			try {
				await subirFotos(reporte.id, fotos);
			} catch (err: any) {
				Alert.alert(
				"Reporte creado",
				"El reporte se registró correctamente, pero no se pudieron subir algunas fotos. Puedes agregarlas después desde el detalle del reporte.",
				);
				router.push("/(main)/reportes");
				return;
			} finally {
				setUploadingFotos(false);
			}
			}

			router.push("/(main)/reportes");
		} catch (err: any) {
			const status = err?.response?.status;
			const msg    = err?.response?.data?.error ?? "Error desconocido";

			if (status === 429) {
			Alert.alert(
				"Límite alcanzado",
				"Como invitado solo puedes enviar 3 reportes por día.\n¿Quieres registrarte para enviar más?",
				[
				{ text: "Ahora no", style: "cancel" },
				{
					text: "Registrarme",
					onPress: () => router.push("/auth/registro"),
				},
				]
			);
			return;
			}

			Alert.alert("Error del servidor", msg);
		}
	};

	const isSubmitting = isPending || uploadingFotos;

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
					<Text style={{ fontSize: 20 }}><Ionicons name="notifications-outline" size={20} color="#64748b" /></Text>
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
												<Text style={{ fontSize: 28 }}><Ionicons name={cat.icon as any} size={28} color={activa ? '#004ac6' : '#434655'} /></Text>
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
									{fotos.map((uri) => (
										<View key={uri} style={{ position: "relative" }}>
											<Image
												source={{ uri }}
												style={{ width: 80, height: 80, borderRadius: 8 }}
												resizeMode="cover"
											/>
											<TouchableOpacity
												onPress={() => eliminarFoto(uri)}
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

						{/* Contador de fotos */}
						<Text style={{ fontSize: 11, color: "#737686" }}>
							{fotos.length}/5 fotos seleccionadas
						</Text>

						{/* Botones de fotos */}
						<View style={{ flexDirection: "row", gap: 8 }}>
							<TouchableOpacity
								onPress={tomarFoto}
								disabled={fotos.length >= 5}
								style={{
									flex: 1,
									padding: 14,
									borderWidth: 2,
									borderStyle: "dashed",
									borderColor: fotos.length >= 5 ? "#e2e8f0" : "#c3c6d7",
									borderRadius: 8,
									alignItems: "center",
									flexDirection: "row",
									justifyContent: "center",
									gap: 6,
									opacity: fotos.length >= 5 ? 0.5 : 1,
								}}
							>
								<Text style={{ fontSize: 16 }}><Ionicons name="camera-outline" size={16} color="#737686" /></Text>
								<Text
									style={{ fontSize: 13, fontWeight: "600", color: "#737686" }}
								>
									Cámara
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={seleccionarFotos}
								disabled={fotos.length >= 5}
								style={{
									flex: 1,
									padding: 14,
									borderWidth: 2,
									borderStyle: "dashed",
									borderColor: fotos.length >= 5 ? "#e2e8f0" : "#c3c6d7",
									borderRadius: 8,
									alignItems: "center",
									flexDirection: "row",
									justifyContent: "center",
									gap: 6,
									opacity: fotos.length >= 5 ? 0.5 : 1,
								}}
							>
								<Text style={{ fontSize: 16 }}><Ionicons name="image-outline" size={16} color="#737686" /></Text>
								<Text
									style={{ fontSize: 13, fontWeight: "600", color: "#737686" }}
								>
									Galería
								</Text>
							</TouchableOpacity>
						</View>
					</View>

					{/* Comunidad */}
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
							<View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
								<Text style={{ fontSize: 16 }}><Ionicons name="location-outline" size={16} color="#0b1c30" /></Text>
								<Text style={{ fontSize: 14, fontWeight: "600", color: "#0b1c30" }}>
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
								<Text style={{ fontSize: 12, fontWeight: "600", color: "#004ac6" }}>
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
								<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
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
											coordinate={{ latitude: location.lat, longitude: location.lng }}
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
										<Text style={{ fontSize: 12, fontWeight: "700", color: "#004ac6" }}>
											{location.lat.toFixed(5)}, {location.lng.toFixed(5)}
										</Text>
										<Text style={{ fontSize: 11, color: "#737686", marginTop: 2 }}>
											Toca para ajustar manualmente
										</Text>
									</View>
								</>
							) : (
								<View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 6 }}>
									<Text style={{ fontSize: 36 }}><Ionicons name="map-outline" size={36} color="#737686" /></Text>
									<Text style={{ fontSize: 12, color: "#737686" }}>
										Toca para seleccionar ubicación
									</Text>
								</View>
							)}
						</TouchableOpacity>
						<Text style={{ fontSize: 12, color: "#737686", marginTop: 8 }}>
							<Ionicons name="information-circle-outline" size={14} color="#737686" /> Puedes mover el mapa para ajustar la ubicación exacta.
						</Text>
					</View>

					{/* Botón enviar */}
					<TouchableOpacity
						onPress={handleSubmit(onSubmit)}
						disabled={isSubmitting || !location}
						style={{
							height: 56,
							backgroundColor: isSubmitting || !location ? "#b4c5ff" : "#004ac6",
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
						{isSubmitting ? (
							<View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
								<ActivityIndicator color="#fff" />
								<Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
									{uploadingFotos ? "Subiendo fotos..." : "Enviando reporte..."}
								</Text>
							</View>
						) : (
							<>
								<Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
									Enviar Reporte
								</Text>
								<Text style={{ fontSize: 18 }}><Ionicons name="send-outline" size={18} color="#fff" /></Text>
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