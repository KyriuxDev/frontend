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
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import Slider from "@react-native-community/slider";
import { crearReporteSchema, CrearReporteInput } from "./reporte.schema";
import { useCrearReporte } from "./reporte.queries";
import MapPicker from "@/src/components/Map";
import { MapView, Marker } from "@/src/components/MapViewWrapper";
import { Ionicons } from '@expo/vector-icons';
import { useOaxacaComunidades } from '@/src/hooks/useOaxaca';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
	verde:      '#1d4e32',
	verdeHover: '#edf7f0',
	verdeMid:   '#dcfce7',
	verdeText:  '#166534',
	verdeBorde: '#b8e0c5',
	bg:         '#f4f6f4',
	blanco:     '#ffffff',
	borde:      '#e8ede8',
	bordeLight: '#f0f4f0',
	texto:      '#0b1c30',
	textoSub:   '#434655',
	textoMuted: '#737686',
	amber:      '#fef3c7',
	amberText:  '#92400e',
	rojo:       '#ba1a1a',
};

const CATEGORIAS = [
  { label: 'BACHES Y PAVIMENTO', value: 'INFRAESTRUCTURA', icon: 'construct-outline'    },
  { label: 'SEÑALIZACIÓN',       value: 'VIALIDAD',        icon: 'flag-outline'         },
  { label: 'BLOQUEOS',           value: 'BLOQUEOS',        icon: 'alert-circle-outline' },
  { label: 'SEGURIDAD',          value: 'SEGURIDAD',       icon: 'shield-outline'       },
];

// ─── Selector de comunidad con búsqueda ───────────────────────────────────────
function ComunidadSelector({
	comunidades,
	value,
	onChange,
}: {
	comunidades: any[];
	value: number;
	onChange: (id: number) => void;
}) {
	const [busqueda, setBusqueda] = useState('');

	const filtradas = useMemo(() => {
		const q = busqueda.trim().toLowerCase();
		if (!q) return comunidades;
		return comunidades.filter((c) => c.nombre.toLowerCase().includes(q));
	}, [comunidades, busqueda]);

	const seleccionada = comunidades.find((c) => c.id === value);

	return (
		<View style={{ gap: 10 }}>

			{/* Buscador */}
			<View style={{
				flexDirection: 'row', alignItems: 'center', gap: 8,
				backgroundColor: '#fafcfa',
				borderWidth: 1, borderColor: C.borde,
				borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
			}}>
				<Ionicons name="search-outline" size={16} color={C.textoMuted} />
				<TextInput
					value={busqueda}
					onChangeText={setBusqueda}
					placeholder="Buscar colonia o comunidad..."
					placeholderTextColor={C.textoMuted}
					style={{ flex: 1, fontSize: 14, color: C.texto }}
					returnKeyType="search"
				/>
				{busqueda.length > 0 && (
					<TouchableOpacity onPress={() => setBusqueda('')}>
						<Ionicons name="close-circle" size={16} color={C.textoMuted} />
					</TouchableOpacity>
				)}
			</View>

			{/* Chip: comunidad ya seleccionada */}
			{seleccionada && (
				<View style={{
					flexDirection: 'row', alignItems: 'center', gap: 8,
					backgroundColor: C.verdeHover,
					borderWidth: 1.5, borderColor: C.verdeBorde,
					borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
				}}>
					<Ionicons name="checkmark-circle" size={16} color={C.verde} />
					<Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: C.verde }} numberOfLines={1}>
						{seleccionada.nombre}
					</Text>
					<Text style={{ fontSize: 10, color: C.verdeText, fontWeight: '600' }}>SELECCIONADA</Text>
				</View>
			)}

			{/* Contador cuando hay búsqueda */}
			{busqueda.length > 0 && (
				<Text style={{ fontSize: 11, color: C.textoMuted }}>
					{filtradas.length === 0
						? `Sin resultados para "${busqueda}"`
						: `${filtradas.length} resultado${filtradas.length !== 1 ? 's' : ''}`}
				</Text>
			)}

			{/* Lista scrolleable */}
			<ScrollView
				style={{
					maxHeight: 200,
					borderWidth: 1, borderColor: C.bordeLight,
					borderRadius: 10, backgroundColor: C.blanco,
				}}
				nestedScrollEnabled
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				{filtradas.length === 0 ? (
					<View style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
						<Ionicons name="search-outline" size={28} color={C.borde} />
						<Text style={{ fontSize: 13, color: C.textoMuted }}>
							No encontramos "{busqueda}"
						</Text>
					</View>
				) : (
					filtradas.map((c, idx) => {
						const sel = c.id === value;
						return (
							<TouchableOpacity
								key={c.id}
								onPress={() => { onChange(c.id); setBusqueda(''); }}
								style={{
									flexDirection: 'row', alignItems: 'center', gap: 10,
									paddingVertical: 12, paddingHorizontal: 14,
									backgroundColor: sel ? C.verdeHover : 'transparent',
									borderBottomWidth: idx < filtradas.length - 1 ? 1 : 0,
									borderBottomColor: C.bordeLight,
								}}
							>
								<View style={{
									width: 8, height: 8, borderRadius: 4, flexShrink: 0,
									backgroundColor: sel ? C.verde : C.bordeLight,
								}} />
								<Text
									style={{
										flex: 1, fontSize: 14,
										fontWeight: sel ? '700' : '400',
										color: sel ? C.verde : C.texto,
									}}
									numberOfLines={1}
								>
									{c.nombre}
								</Text>
								{sel && <Ionicons name="checkmark" size={16} color={C.verde} />}
							</TouchableOpacity>
						);
					})
				)}
			</ScrollView>
		</View>
	);
}

// ─── Formulario principal ─────────────────────────────────────────────────────
export function FormularioReporte() {
	const router = useRouter();
	const { mutateAsync: crearAsync, isPending } = useCrearReporte();
	const [uploadingFotos, setUploadingFotos] = useState(false);
	const [fotos, setFotos]           = useState<string[]>([]);
	const [location, setLocation]     = useState<{ lat: number; lng: number } | null>(null);
	const [loadingGPS, setLoadingGPS] = useState(false);
	const { data: comunidades }       = useOaxacaComunidades('ACTIVO');
	const [mapVisible, setMapVisible] = useState(false);

	const { control, handleSubmit, setValue, watch, formState: { errors } } =
		useForm<CrearReporteInput>({
			resolver: zodResolver(crearReporteSchema),
			defaultValues: { gravedad: 3, categoria: "INFRAESTRUCTURA", comunidadId: 1 },
		});

	const gravedadActiva = watch("gravedad");

	useEffect(() => { obtenerUbicacion(); }, []);

	async function obtenerUbicacion() {
		setLoadingGPS(true);
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				Alert.alert("Permiso denegado", "Se necesita acceso a la ubicación.");
				return;
			}
			const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
			setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
			setValue("latitud", loc.coords.latitude);
			setValue("longitud", loc.coords.longitude);
		} catch { Alert.alert("Error", "No se pudo obtener la ubicación."); }
		finally   { setLoadingGPS(false); }
	}

	async function seleccionarFotos() {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") { Alert.alert("Permiso denegado", "Se necesita acceso a la galería."); return; }
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.7,
		});
		if (!result.canceled)
			setFotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
	}

	async function tomarFoto() {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") { Alert.alert("Permiso denegado", "Se necesita acceso a la cámara."); return; }
		const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
		if (!result.canceled) setFotos((prev) => [...prev, result.assets[0].uri].slice(0, 5));
	}

	function eliminarFoto(uri: string) { setFotos((prev) => prev.filter((f) => f !== uri)); }

	async function subirFotos(reporteId: number, uris: string[]) {
		const formData = new FormData();
		uris.forEach((uri, i) => {
			const ext  = uri.split(".").pop()?.toLowerCase() ?? "jpg";
			const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
			formData.append("fotos", { uri, name: `foto-${i}.${ext}`, type: mime } as any);
		});
		const token   = Platform.OS === "web"
			? localStorage.getItem("access_token")
			: await (await import("expo-secure-store")).getItemAsync("access_token");
		const baseURL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
		const res     = await fetch(`${baseURL}/reportes/${reporteId}/fotos`, {
			method: "POST",
			headers: token ? { Authorization: `Bearer ${token}` } : {},
			body: formData,
		});
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(body?.error ?? `Error ${res.status}`);
		}
		return res.json();
	}

	const onSubmit = async (data: CrearReporteInput) => {
		try {
			const reporte = await crearAsync({ ...data, fuente: "APP_MOVIL" });
			if (fotos.length > 0) {
				setUploadingFotos(true);
				try { await subirFotos(reporte.id, fotos); }
				catch {
					Alert.alert("Reporte creado", "Registrado correctamente, pero no se pudieron subir algunas fotos.");
					router.push("/(main)/reportes"); return;
				} finally { setUploadingFotos(false); }
			}
			router.push("/(main)/reportes");
		} catch (err: any) {
			if (err?.response?.status === 429) {
				Alert.alert(
					"Límite alcanzado",
					"Como invitado solo puedes enviar 3 reportes por día.\n¿Quieres registrarte?",
					[
						{ text: "Ahora no", style: "cancel" },
						{ text: "Registrarme", onPress: () => router.push("/auth/registro") },
					]
				);
				return;
			}
			Alert.alert("Error del servidor", err?.response?.data?.error ?? "Error desconocido");
		}
	};

	const isSubmitting = isPending || uploadingFotos;
	const card = {
		backgroundColor: C.blanco, borderRadius: 12, padding: 16,
		borderWidth: 1, borderColor: C.bordeLight,
		shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
	};

	return (
		<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
			<ScrollView style={{ flex: 1, backgroundColor: C.bg }} showsVerticalScrollIndicator={false}>

				{/* ── Header ── */}
				<View style={{
					flexDirection: "row", alignItems: "center", gap: 12,
					paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12,
					backgroundColor: C.verde,
				}}>
					<TouchableOpacity onPress={() => router.back()}>
						<Ionicons name="arrow-back-outline" size={22} color="#fff" />
					</TouchableOpacity>
					<View style={{ flex: 1 }}>
						<Text style={{ fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 }}>
							Nuevo Reporte
						</Text>
						<Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
							Informa una incidencia en tu comunidad
						</Text>
					</View>
					<View style={{
						backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99,
						paddingHorizontal: 10, paddingVertical: 4,
					}}>
						<Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>IRSU</Text>
					</View>
				</View>

				<View style={{ padding: 16, gap: 14 }}>

					{/* ── Categoría ── */}
					<View style={card}>
						<Text style={{ fontSize: 13, fontWeight: '700', color: C.texto, marginBottom: 12 }}>
							Categoría de Incidencia
						</Text>
						<Controller
							control={control}
							name="categoria"
							render={({ field: { onChange, value } }) => (
								<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
									{CATEGORIAS.map((cat) => {
										const activa = value === cat.value;
										return (
											<TouchableOpacity
												key={cat.value}
												onPress={() => onChange(cat.value)}
												style={{
													width: "47%", padding: 14, borderRadius: 10,
													borderWidth: activa ? 2 : 1,
													borderColor: activa ? C.verde : C.bordeLight,
													backgroundColor: activa ? C.verdeHover : C.blanco,
													alignItems: "center", gap: 6,
												}}
											>
												<Ionicons name={cat.icon as any} size={26} color={activa ? C.verde : C.textoMuted} />
												<Text style={{
													fontSize: 10, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3,
													color: activa ? C.verde : C.textoSub,
												}}>
													{cat.label}
												</Text>
											</TouchableOpacity>
										);
									})}
								</View>
							)}
						/>
					</View>

					{/* ── Título ── */}
					<View style={card}>
						<Text style={{ fontSize: 13, fontWeight: '700', color: C.texto, marginBottom: 8 }}>
							Título del reporte
						</Text>
						<Controller
							control={control}
							name="titulo"
							render={({ field: { onChange, value } }) => (
								<TextInput
									onChangeText={onChange}
									value={value}
									placeholder="Ej: Bache profundo en Av. Principal"
									placeholderTextColor={C.textoMuted}
									style={{
										borderWidth: 1,
										borderColor: errors.titulo ? C.rojo : C.bordeLight,
										borderRadius: 8, padding: 12,
										fontSize: 15, color: C.texto, backgroundColor: '#fafcfa',
									}}
								/>
							)}
						/>
						{errors.titulo && (
							<Text style={{ color: C.rojo, fontSize: 12, marginTop: 4 }}>{errors.titulo.message}</Text>
						)}
					</View>

					{/* ── Gravedad ── */}
					<View style={card}>
						<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
							<Text style={{ fontSize: 13, fontWeight: '700', color: C.texto }}>Gravedad percibida</Text>
							<View style={{
								backgroundColor: gravedadActiva >= 4 ? '#fee2e2' : gravedadActiva >= 3 ? C.amber : C.verdeMid,
								paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
							}}>
								<Text style={{
									fontSize: 11, fontWeight: '700',
									color: gravedadActiva >= 4 ? '#991b1b' : gravedadActiva >= 3 ? C.amberText : C.verdeText,
								}}>
									NIVEL {gravedadActiva}
								</Text>
							</View>
						</View>
						<Controller
							control={control}
							name="gravedad"
							render={({ field: { onChange, value } }) => (
								<Slider
									minimumValue={1} maximumValue={5} step={1} value={value}
									onValueChange={(v) => onChange(Math.round(v))}
									minimumTrackTintColor={C.verde}
									maximumTrackTintColor={C.bordeLight}
									thumbTintColor={C.verde}
								/>
							)}
						/>
						<View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 }}>
							{[1, 2, 3, 4, 5].map((n) => (
								<Text key={n} style={{ fontSize: 12, color: C.textoMuted }}>{n}</Text>
							))}
						</View>
					</View>

					{/* ── Descripción y fotos ── */}
					<View style={{ ...card, gap: 12 }}>
						<Text style={{ fontSize: 13, fontWeight: '700', color: C.texto }}>Descripción y evidencia</Text>
						<Controller
							control={control}
							name="descripcion"
							render={({ field: { onChange, value } }) => (
								<TextInput
									onChangeText={onChange}
									value={value}
									placeholder="Describe brevemente lo ocurrido..."
									placeholderTextColor={C.textoMuted}
									multiline numberOfLines={4}
									style={{
										borderWidth: 1, borderColor: C.bordeLight, borderRadius: 8,
										padding: 12, fontSize: 14, color: C.texto, backgroundColor: '#fafcfa',
										minHeight: 90, textAlignVertical: "top",
									}}
								/>
							)}
						/>

						{fotos.length > 0 && (
							<ScrollView horizontal showsHorizontalScrollIndicator={false}>
								<View style={{ flexDirection: "row", gap: 8 }}>
									{fotos.map((uri) => (
										<View key={uri} style={{ position: "relative" }}>
											<Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8 }} resizeMode="cover" />
											<TouchableOpacity
												onPress={() => eliminarFoto(uri)}
												style={{
													position: "absolute", top: -4, right: -4,
													backgroundColor: C.rojo, borderRadius: 999,
													width: 20, height: 20, alignItems: "center", justifyContent: "center",
												}}
											>
												<Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>✕</Text>
											</TouchableOpacity>
										</View>
									))}
								</View>
							</ScrollView>
						)}

						<Text style={{ fontSize: 11, color: C.textoMuted }}>{fotos.length}/5 fotos</Text>

						<View style={{ flexDirection: "row", gap: 8 }}>
							{[
								{ label: 'Cámara', icon: 'camera-outline', fn: tomarFoto },
								{ label: 'Galería', icon: 'image-outline',  fn: seleccionarFotos },
							].map(({ label, icon, fn }) => (
								<TouchableOpacity
									key={label} onPress={fn} disabled={fotos.length >= 5}
									style={{
										flex: 1, padding: 12,
										borderWidth: 1.5, borderStyle: "dashed",
										borderColor: fotos.length >= 5 ? C.bordeLight : C.verdeBorde,
										borderRadius: 8, alignItems: "center",
										flexDirection: "row", justifyContent: "center", gap: 6,
										opacity: fotos.length >= 5 ? 0.5 : 1,
										backgroundColor: fotos.length >= 5 ? '#fafcfa' : C.verdeHover,
									}}
								>
									<Ionicons name={icon as any} size={16} color={fotos.length >= 5 ? C.textoMuted : C.verde} />
									<Text style={{ fontSize: 13, fontWeight: "600", color: fotos.length >= 5 ? C.textoMuted : C.verde }}>
										{label}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>

					{/* ── Comunidad con buscador ── */}
					<View style={card}>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
							<Ionicons name="people-outline" size={16} color={C.verde} />
							<Text style={{ fontSize: 13, fontWeight: '700', color: C.texto }}>Comunidad</Text>
							{(comunidades ?? []).length > 0 && (
								<View style={{
									backgroundColor: C.verdeMid, borderRadius: 99,
									paddingHorizontal: 8, paddingVertical: 2, marginLeft: 'auto',
								}}>
									<Text style={{ fontSize: 10, fontWeight: '700', color: C.verdeText }}>
										{(comunidades ?? []).length} disponibles
									</Text>
								</View>
							)}
						</View>

						<Controller
							control={control}
							name="comunidadId"
							render={({ field: { onChange, value } }) => (
								<ComunidadSelector
									comunidades={comunidades ?? []}
									value={value}
									onChange={onChange}
								/>
							)}
						/>

						{errors.comunidadId && (
							<Text style={{ color: C.rojo, fontSize: 12, marginTop: 6 }}>
								Selecciona una comunidad
							</Text>
						)}
					</View>

					{/* ── Ubicación ── */}
					<View style={card}>
						<View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
							<View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
								<Ionicons name="location-outline" size={16} color={C.verde} />
								<Text style={{ fontSize: 13, fontWeight: '700', color: C.texto }}>Ubicación</Text>
							</View>
							<TouchableOpacity
								onPress={obtenerUbicacion}
								style={{
									backgroundColor: C.verdeHover, paddingHorizontal: 10,
									paddingVertical: 5, borderRadius: 8,
									borderWidth: 1, borderColor: C.verdeBorde,
								}}
							>
								<Text style={{ fontSize: 11, fontWeight: '600', color: C.verde }}>Mi ubicación</Text>
							</TouchableOpacity>
						</View>

						<TouchableOpacity
							activeOpacity={0.9}
							onPress={() => setMapVisible(true)}
							style={{
								height: 210, borderRadius: 12, overflow: "hidden",
								borderWidth: 1, borderColor: C.bordeLight,
								backgroundColor: C.verdeHover,
							}}
						>
							{loadingGPS ? (
								<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
									<ActivityIndicator color={C.verde} />
								</View>
							) : location ? (
								<>
									<MapView
										style={{ flex: 1 }}
										pointerEvents="none"
										region={{
											latitude: location.lat, longitude: location.lng,
											latitudeDelta: 0.005, longitudeDelta: 0.005,
										}}
									>
										<Marker coordinate={{ latitude: location.lat, longitude: location.lng }} />
									</MapView>
									<View style={{
										position: "absolute", bottom: 10, left: 10, right: 10,
										backgroundColor: "rgba(255,255,255,0.95)",
										padding: 10, borderRadius: 10,
										borderWidth: 1, borderColor: C.verdeBorde,
									}}>
										<Text style={{ fontSize: 12, fontWeight: "700", color: C.verde }}>
											{location.lat.toFixed(5)}, {location.lng.toFixed(5)}
										</Text>
										<Text style={{ fontSize: 11, color: C.textoMuted, marginTop: 2 }}>
											Toca para ajustar manualmente
										</Text>
									</View>
								</>
							) : (
								<View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}>
									<Ionicons name="map-outline" size={36} color={C.verdeBorde} />
									<Text style={{ fontSize: 12, color: C.textoMuted }}>Toca para seleccionar ubicación</Text>
								</View>
							)}
						</TouchableOpacity>

						<Text style={{ fontSize: 11, color: C.textoMuted, marginTop: 8 }}>
							Mueve el mapa para ajustar la ubicación exacta.
						</Text>
					</View>

					{/* ── Botón enviar ── */}
					<TouchableOpacity
						onPress={handleSubmit(onSubmit)}
						disabled={isSubmitting || !location}
						style={{
							height: 54,
							backgroundColor: isSubmitting || !location ? C.verdeBorde : C.verde,
							borderRadius: 12, alignItems: "center", justifyContent: "center",
							flexDirection: "row", gap: 8,
							shadowColor: C.verde, shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.25, shadowRadius: 8, elevation: 4, marginTop: 4,
						}}
					>
						{isSubmitting ? (
							<View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
								<ActivityIndicator color="#fff" />
								<Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
									{uploadingFotos ? "Subiendo fotos..." : "Enviando reporte..."}
								</Text>
							</View>
						) : (
							<>
								<Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Enviar Reporte</Text>
								<Ionicons name="send-outline" size={18} color="#fff" />
							</>
						)}
					</TouchableOpacity>

					<Text style={{
						textAlign: "center", fontSize: 11, color: C.textoMuted,
						paddingHorizontal: 16, paddingBottom: 40,
					}}>
						Al enviar confirmas que la información es verídica y autorizas su gestión ciudadana.
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