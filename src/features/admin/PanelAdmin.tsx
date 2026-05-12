import { useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
	TextInput,
	Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/src/store/auth.store";
import {
	useReportes,
	useCambiarEstadoReporte,
} from "@/src/features/reportes/reporte.queries";
import {
	useActualizarComunidad,
} from "@/src/features/comunidades/comunidad.queries";
import {
	ReporteResumen,
	EstadoReporte,
} from "@/src/features/reportes/reporte.types";
import { formatearFechaCorta } from "@/src/utils/formatDate";
import { SeccionDashboard } from "./SeccionDashboard";
import { useReporteStats } from "./dashboard.queries";
import { Paginacion } from "@/src/components/pagination";
import { SeccionCuadrillas } from "@/src/features/admin/SeccionCuadrillas";
import { useOaxacaComunidades } from "@/src/hooks/useOaxaca";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const C = {
	verde: "#1d4e32",
	verdeHover: "#edf7f0",
	verdeBorde: "#b8e0c5",
	verdeMid: "#dcfce7",
	verdeText: "#166534",
	bg: "#f4f6f4",
	blanco: "#ffffff",
	borde: "#e8ede8",
	bordeLight: "#f0f4f0",
	texto: "#0f1f0f",
	textoSub: "#4a5e4a",
	textoMuted: "#9aaa9a",
	amber: "#fef3c7",
	amberText: "#92400e",
	amberDot: "#d97706",
	azul: "#dbeafe",
	azulText: "#1e40af",
	azulDot: "#3b82f6",
	rojo: "#fee2e2",
	rojoText: "#991b1b",
	rojoDot: "#dc2626",
};

type Tab = "dashboard" | "reportes" | "comunidades" | "alertas" | "usuarios" | "cuadrillas";

function estadoCfg(e: EstadoReporte) {
	switch (e) {
		case "PENDIENTE":
			return { bg: C.amber, text: C.amberText, dot: C.amberDot, label: "Pendiente" };
		case "EN_PROCESO":
			return { bg: C.azul, text: C.azulText, dot: C.azulDot, label: "En Proceso" };
		case "RESUELTO":
			return { bg: C.verdeMid, text: C.verdeText, dot: "#16a34a", label: "Resuelto" };
		case "RECHAZADO":
			return { bg: C.rojo, text: C.rojoText, dot: C.rojoDot, label: "Rechazado" };
	}
}

// ─── Nav config ───────────────────────────────────────────────────────────────
type NavItem = {
	key: Tab;
	label: string;
	icon: React.ComponentProps<typeof MaterialIcons>["name"];
	badge?: { n: number; color: string; bg: string };
};

const NAV: NavItem[] = [
	{ key: "dashboard",   label: "Dashboard",    icon: "dashboard"       },
	{ key: "reportes",    label: "Reportes",     icon: "assessment",     badge: { n: 12, color: C.amberText, bg: C.amber } },
	{ key: "comunidades", label: "Comunidades",  icon: "groups"          },
	{ key: "cuadrillas",  label: "Cuadrillas",   icon: "engineering"     },
	{ key: "alertas",     label: "Alertas",      icon: "notifications",  badge: { n: 3, color: C.rojoText, bg: C.rojo } },
	{ key: "usuarios",    label: "Usuarios",     icon: "manage-accounts" },
];

const NAV_FOOTER: {
	icon: React.ComponentProps<typeof MaterialIcons>["name"];
	label: string;
}[] = [
	{ icon: "settings", label: "Ajustes" },
	{ icon: "logout",   label: "Cerrar sesión" },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({
	tab,
	setTab,
	usuario,
}: {
	tab: Tab;
	setTab: (t: Tab) => void;
	usuario: any;
}) {
	const ini = (usuario?.nombre ?? usuario?.email ?? "A")
		.split(" ")
		.map((w: string) => w[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<View
			style={{
				width: 240,
				backgroundColor: C.blanco,
				borderRightWidth: 1,
				borderRightColor: C.borde,
				flexDirection: "column",
			}}
		>
			{/* Logo */}
			<View
				style={{
					padding: 20,
					paddingBottom: 16,
					borderBottomWidth: 1,
					borderBottomColor: C.bordeLight,
				}}
			>
				<View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
					<View
						style={{
							width: 36,
							height: 36,
							backgroundColor: C.verde,
							borderRadius: 10,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>
							IR
						</Text>
					</View>
					<View>
						<Text
							style={{
								fontSize: 17,
								fontWeight: "800",
								color: C.texto,
								letterSpacing: -0.5,
							}}
						>
							IRSU
						</Text>
						<Text style={{ fontSize: 10, color: C.textoMuted, marginTop: 1 }}>
							Administración Central
						</Text>
					</View>
				</View>
			</View>

			{/* Nav principal */}
			<ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
				<View style={{ paddingVertical: 8 }}>
					{NAV.map((item) => {
						const activo = tab === item.key;
						return (
							<TouchableOpacity
								key={item.key}
								onPress={() => setTab(item.key)}
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: 12,
									paddingVertical: 10,
									paddingHorizontal: 20,
									marginHorizontal: 8,
									marginVertical: 1,
									borderRadius: 8,
									backgroundColor: activo ? C.verdeHover : "transparent",
									position: "relative",
								}}
							>
								{activo && (
									<View
										style={{
											position: "absolute",
											left: -8,
											top: 8,
											bottom: 8,
											width: 3,
											backgroundColor: C.verde,
											borderRadius: 3,
										}}
									/>
								)}
								<MaterialIcons
									name={item.icon}
									size={22}
									color={activo ? C.verde : C.textoMuted}
								/>
								<Text
									style={{
										fontSize: 14,
										flex: 1,
										fontWeight: activo ? "700" : "500",
										color: activo ? C.verde : C.textoSub,
									}}
								>
									{item.label}
								</Text>
								{item.badge && (
									<View
										style={{
											backgroundColor: item.badge.bg,
											paddingHorizontal: 7,
											paddingVertical: 1,
											borderRadius: 99,
										}}
									>
										<Text
											style={{
												fontSize: 10,
												fontWeight: "700",
												color: item.badge.color,
											}}
										>
											{item.badge.n}
										</Text>
									</View>
								)}
							</TouchableOpacity>
						);
					})}
				</View>
			</ScrollView>

			{/* Footer */}
			<View style={{ borderTopWidth: 1, borderTopColor: C.bordeLight }}>
				{NAV_FOOTER.map((item) => (
					<TouchableOpacity
						key={item.label}
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: 12,
							paddingVertical: 10,
							paddingHorizontal: 20,
							marginHorizontal: 8,
							marginVertical: 1,
							borderRadius: 8,
						}}
					>
						<MaterialIcons name={item.icon} size={20} color={C.textoMuted} />
						<Text style={{ fontSize: 14, color: C.textoSub, fontWeight: "500" }}>
							{item.label}
						</Text>
					</TouchableOpacity>
				))}

				{/* Tarjeta de usuario */}
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 10,
						padding: 14,
						margin: 8,
						borderRadius: 8,
						borderTopWidth: 1,
						borderTopColor: C.bordeLight,
						marginTop: 4,
					}}
				>
					<View
						style={{
							width: 32,
							height: 32,
							borderRadius: 16,
							backgroundColor: C.verdeHover,
							borderWidth: 1.5,
							borderColor: C.verdeBorde,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Text style={{ fontSize: 11, fontWeight: "800", color: C.verde }}>
							{ini}
						</Text>
					</View>
					<View style={{ flex: 1 }}>
						<Text
							style={{ fontSize: 12.5, fontWeight: "700", color: C.texto }}
							numberOfLines={1}
						>
							{usuario?.nombre ?? usuario?.email}
						</Text>
						<Text style={{ fontSize: 10, color: C.textoMuted }}>
							{usuario?.rol}
						</Text>
					</View>
					<MaterialIcons name="more-vert" size={18} color={C.textoMuted} />
				</View>
				<View style={{ height: 8 }} />
			</View>
		</View>
	);
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
const TITULOS: Record<Tab, string> = {
	dashboard:   "IRSU Dashboard",
	reportes:    "Gestión de Reportes",
	comunidades: "Gestión de Comunidades",
	cuadrillas:  "Gestión de Cuadrillas",
	alertas:     "Alertas Activas",
	usuarios:    "Gestión de Usuarios",
};
const SUBS: Record<Tab, string> = {
	dashboard:   "Resumen general del sistema",
	reportes:    "Revisa y actualiza el estado de incidencias ciudadanas",
	comunidades: "Administra y activa comunidades del municipio",
	cuadrillas:  "Asigna cuadrillas según prioridad IRSU",
	alertas:     "Gestiona alertas críticas del sistema",
	usuarios:    "Administra roles y permisos",
};

function TopBar({ tab, usuario }: { tab: Tab; usuario: any }) {
	const ini = (usuario?.nombre ?? usuario?.email ?? "A")
		.split(" ")
		.map((w: string) => w[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<View
			style={{
				height: 52,
				backgroundColor: C.blanco,
				borderBottomWidth: 1,
				borderBottomColor: C.borde,
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
				paddingHorizontal: 24,
			}}
		>
			<View>
				<Text style={{ fontSize: 15, fontWeight: "700", color: C.texto }}>
					{TITULOS[tab]}
				</Text>
				<Text style={{ fontSize: 11, color: C.textoMuted }}>{SUBS[tab]}</Text>
			</View>

			<View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
				<TouchableOpacity>
					<MaterialIcons name="notifications" size={22} color={C.textoMuted} />
				</TouchableOpacity>
				<TouchableOpacity>
					<MaterialIcons name="help-outline" size={22} color={C.textoMuted} />
				</TouchableOpacity>
				<View style={{ width: 1, height: 28, backgroundColor: C.borde }} />
				<View style={{ alignItems: "flex-end" }}>
					<Text
						style={{
							fontSize: 10,
							fontWeight: "700",
							color: C.textoMuted,
							letterSpacing: 0.5,
						}}
					>
						ADMINISTRADOR
					</Text>
					<Text style={{ fontSize: 12, fontWeight: "700", color: C.verde }}>
						{usuario?.nombre ?? usuario?.email}
					</Text>
				</View>
				<View
					style={{
						width: 32,
						height: 32,
						borderRadius: 16,
						backgroundColor: C.verdeHover,
						borderWidth: 1.5,
						borderColor: C.verdeBorde,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text style={{ fontSize: 11, fontWeight: "800", color: C.verde }}>
						{ini}
					</Text>
				</View>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 6,
						backgroundColor: C.verdeHover,
						borderWidth: 1,
						borderColor: C.verdeBorde,
						borderRadius: 99,
						paddingHorizontal: 12,
						paddingVertical: 5,
					}}
				>
					<View
						style={{
							width: 7,
							height: 7,
							borderRadius: 99,
							backgroundColor: "#22c55e",
						}}
					/>
					<Text style={{ fontSize: 11, fontWeight: "700", color: C.verde }}>
						Sistema activo
					</Text>
				</View>
			</View>
		</View>
	);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
	label,
	value,
	icon,
	topColor,
}: {
	label: string;
	value: number;
	icon: React.ComponentProps<typeof MaterialIcons>["name"];
	topColor: string;
}) {
	return (
		<View
			style={{
				flex: 1,
				minWidth: 130,
				backgroundColor: C.blanco,
				borderRadius: 10,
				borderWidth: 1,
				borderColor: C.borde,
				padding: 16,
				borderTopWidth: 3,
				borderTopColor: topColor,
			}}
		>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					marginBottom: 10,
				}}
			>
				<Text
					style={{
						fontSize: 10,
						fontWeight: "700",
						color: C.textoMuted,
						letterSpacing: 0.5,
					}}
				>
					{label.toUpperCase()}
				</Text>
				<MaterialIcons
					name={icon}
					size={20}
					color={topColor}
					style={{ opacity: 0.4 }}
				/>
			</View>
			<Text
				style={{
					fontSize: 30,
					fontWeight: "800",
					color: C.texto,
					letterSpacing: -1,
				}}
			>
				{value}
			</Text>
		</View>
	);
}

// ─── Chip estado ──────────────────────────────────────────────────────────────
function ChipEstado({ estado }: { estado: EstadoReporte }) {
	const c = estadoCfg(estado);
	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				gap: 5,
				backgroundColor: c.bg,
				paddingHorizontal: 9,
				paddingVertical: 3,
				borderRadius: 99,
			}}
		>
			<View
				style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.dot }}
			/>
			<Text style={{ fontSize: 11, fontWeight: "700", color: c.text }}>
				{c.label}
			</Text>
		</View>
	);
}

// ─── Fila reporte ─────────────────────────────────────────────────────────────
function FilaReporte({ reporte }: { reporte: ReporteResumen }) {
	const [open, setOpen] = useState(false);
	const { mutate, isPending } = useCambiarEstadoReporte(reporte.id);

	const catDot =
		reporte.categoria === "VIALIDAD"
			? C.amberDot
			: reporte.categoria === "INFRAESTRUCTURA"
				? C.azulDot
				: reporte.categoria === "SEGURIDAD"
					? "#16a34a"
					: "#db2777";

	return (
		<View
			style={{
				borderRadius: 8,
				borderWidth: 1,
				borderColor: open ? C.verde : C.borde,
				marginBottom: 6,
				backgroundColor: C.blanco,
				overflow: "hidden",
			}}
		>
			<TouchableOpacity
				onPress={() => setOpen(!open)}
				style={{
					flexDirection: "row",
					alignItems: "center",
					padding: 12,
					gap: 10,
				}}
			>
				<View
					style={{
						width: 3,
						height: 38,
						borderRadius: 2,
						backgroundColor: catDot,
					}}
				/>
				<View style={{ flex: 1 }}>
					<Text
						style={{ fontSize: 13.5, fontWeight: "600", color: C.texto }}
						numberOfLines={1}
					>
						{reporte.titulo}
					</Text>
					<Text style={{ fontSize: 11, color: C.textoMuted, marginTop: 2 }}>
						{reporte.comunidad.nombre} ·{" "}
						{formatearFechaCorta(reporte.createdAt)} · ★ {reporte.gravedad}/5
					</Text>
				</View>
				<View
					style={{
						backgroundColor: "#f1f5f9",
						paddingHorizontal: 7,
						paddingVertical: 2,
						borderRadius: 4,
					}}
				>
					<Text
						style={{ fontSize: 10, fontWeight: "700", color: C.textoMuted }}
					>
						{reporte.categoria}
					</Text>
				</View>
				<ChipEstado estado={reporte.estado} />
				<MaterialIcons
					name={open ? "keyboard-arrow-up" : "keyboard-arrow-down"}
					size={20}
					color={C.textoMuted}
				/>
			</TouchableOpacity>

			{open && (
				<View
					style={{
						borderTopWidth: 1,
						borderTopColor: C.bordeLight,
						padding: 12,
						backgroundColor: "#fafcfa",
					}}
				>
					<Text
						style={{
							fontSize: 10,
							fontWeight: "700",
							color: C.textoMuted,
							marginBottom: 10,
							letterSpacing: 0.5,
						}}
					>
						CAMBIAR ESTADO
					</Text>
					{isPending ? (
						<ActivityIndicator color={C.verde} />
					) : (
						<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
							{(
								[
									"PENDIENTE",
									"EN_PROCESO",
									"RESUELTO",
									"RECHAZADO",
								] as EstadoReporte[]
							).map((e) => {
								const c = estadoCfg(e);
								const activo = e === reporte.estado;
								return (
									<TouchableOpacity
										key={e}
										onPress={() => {
											if (activo) return;
											Alert.alert("Confirmar", `¿Cambiar a "${c.label}"?`, [
												{ text: "Cancelar", style: "cancel" },
												{
													text: "Confirmar",
													onPress: () => mutate({ estado: e }),
												},
											]);
										}}
										style={{
											flexDirection: "row",
											alignItems: "center",
											gap: 6,
											paddingHorizontal: 12,
											paddingVertical: 7,
											borderRadius: 7,
											borderWidth: activo ? 2 : 1,
											borderColor: activo ? c.dot : C.borde,
											backgroundColor: activo ? c.bg : C.blanco,
										}}
									>
										<View
											style={{
												width: 6,
												height: 6,
												borderRadius: 3,
												backgroundColor: c.dot,
											}}
										/>
										<Text
											style={{
												fontSize: 12,
												fontWeight: "600",
												color: activo ? c.text : C.textoSub,
											}}
										>
											{c.label}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					)}
				</View>
			)}
		</View>
	);
}

// ─── Sección Reportes ─────────────────────────────────────────────────────────
function SeccionReportes() {
	const [filtro, setFiltro] = useState<EstadoReporte | undefined>(undefined);
	const [page, setPage] = useState(1);
	const { data, isLoading, isError, refetch } = useReportes({ estado: filtro, page });
	const { data: stats } = useReporteStats();
	const totalPages = data?.meta?.totalPages ?? 1;

	const FILTROS = [
		{ label: "Todos",      value: undefined },
		{ label: "Pendiente",  value: "PENDIENTE"  as EstadoReporte },
		{ label: "En Proceso", value: "EN_PROCESO" as EstadoReporte },
		{ label: "Resuelto",   value: "RESUELTO"   as EstadoReporte },
		{ label: "Rechazado",  value: "RECHAZADO"  as EstadoReporte },
	];

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			{/* Stats */}
			<View style={{ flexDirection: "row", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
				<StatCard label="Pendientes" value={stats?.PENDIENTE  ?? 0} icon="pending"      topColor={C.amberDot} />
				<StatCard label="En Proceso" value={stats?.EN_PROCESO ?? 0} icon="sync"         topColor={C.azulDot}  />
				<StatCard label="Resueltos"  value={stats?.RESUELTO   ?? 0} icon="check-circle" topColor="#16a34a"    />
				<StatCard label="Rechazados" value={stats?.RECHAZADO  ?? 0} icon="cancel"       topColor={C.rojoDot}  />
			</View>

			{/* Filtros */}
			<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
				{FILTROS.map((f) => {
					const activo = filtro === f.value;
					return (
						<TouchableOpacity
							key={String(f.value)}
							onPress={() => setFiltro(f.value)}
							style={{
								paddingHorizontal: 14,
								paddingVertical: 6,
								borderRadius: 99,
								backgroundColor: activo ? C.verde : C.blanco,
								borderWidth: 1,
								borderColor: activo ? C.verde : C.borde,
							}}
						>
							<Text
								style={{
									fontSize: 12,
									fontWeight: "600",
									color: activo ? "#fff" : C.textoSub,
								}}
							>
								{f.label}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>

			{/* Encabezado tabla */}
			<View
				style={{
					flexDirection: "row",
					paddingHorizontal: 14,
					paddingVertical: 8,
					backgroundColor: "#f9fafb",
					borderRadius: 8,
					marginBottom: 8,
					borderWidth: 1,
					borderColor: C.borde,
				}}
			>
				<Text style={{ flex: 1, fontSize: 10, fontWeight: "700", color: C.textoMuted, letterSpacing: 0.5 }}>
					REPORTE
				</Text>
				<Text style={{ fontSize: 10, fontWeight: "700", color: C.textoMuted, letterSpacing: 0.5, marginRight: 90 }}>
					ESTADO
				</Text>
			</View>

			{isLoading && (
				<View style={{ alignItems: "center", paddingVertical: 40 }}>
					<ActivityIndicator color={C.verde} size="large" />
					<Text style={{ color: C.textoMuted, marginTop: 10 }}>Cargando reportes...</Text>
				</View>
			)}
			{isError && (
				<View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
					<MaterialIcons name="error-outline" size={40} color={C.textoMuted} />
					<Text style={{ color: C.textoMuted }}>Error al cargar reportes</Text>
					<TouchableOpacity
						onPress={() => refetch()}
						style={{
							backgroundColor: C.verde,
							paddingHorizontal: 20,
							paddingVertical: 8,
							borderRadius: 8,
						}}
					>
						<Text style={{ color: "#fff", fontWeight: "600" }}>Reintentar</Text>
					</TouchableOpacity>
				</View>
			)}
			{!isLoading && !isError && (data?.data ?? []).length === 0 && (
				<View style={{ alignItems: "center", paddingVertical: 60, gap: 12 }}>
					<MaterialIcons name="inbox" size={48} color={C.textoMuted} />
					<Text style={{ color: C.textoMuted }}>No hay reportes con este filtro</Text>
				</View>
			)}

			{(data?.data ?? []).map((r) => (
				<FilaReporte key={r.id} reporte={r} />
			))}
			<Paginacion
				page={page}
				totalPages={totalPages}
				onPrev={() => setPage((p) => Math.max(1, p - 1))}
				onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
			/>
			<View style={{ height: 40 }} />
		</ScrollView>
	);
}

// ─── Sección Comunidades ──────────────────────────────────────────────────────
function SeccionComunidades() {
	const [busqueda, setBusqueda] = useState("");
	const { data, isLoading }                       = useOaxacaComunidades();
	const { mutate: activar, isPending: activando } = useActualizarComunidad();

	const comunidades = data ?? [];

	const comunidadesFiltradas = comunidades.filter((c: any) =>
		c.nombre.toLowerCase().includes(busqueda.toLowerCase()),
	);

	const activas    = comunidades.filter((c: any) => c.status === "ACTIVO").length;
	const pendientes = comunidades.filter((c: any) => c.status === "PENDIENTE").length;

	const irsuColor = (v: number) =>
		v > 100 ? C.rojoDot : v > 50 ? C.amberDot : "#16a34a";

	const statusCfg = (s: string) => {
		if (s === "ACTIVO")    return { bg: C.verdeMid, text: C.verdeText, dot: "#16a34a" };
		if (s === "PENDIENTE") return { bg: C.amber,    text: C.amberText, dot: C.amberDot };
		if (s === "RECHAZADO") return { bg: C.rojo,     text: C.rojoText,  dot: C.rojoDot };
		return { bg: "#f1f5f9", text: "#64748b", dot: "#94a3b8" };
	};

	return (
		<View style={{ flex: 1 }}>
			{/* Stats */}
			<View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
				<StatCard label="Activas"    value={activas}    icon="location-city" topColor={C.verde}    />
				<StatCard label="Pendientes" value={pendientes} icon="pending"       topColor={C.amberDot} />
			</View>

			{/* Buscador */}
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					gap: 10,
					backgroundColor: C.blanco,
					borderRadius: 10,
					borderWidth: 1,
					borderColor: C.borde,
					paddingHorizontal: 12,
					paddingVertical: 8,
					marginBottom: 14,
				}}
			>
				<MaterialIcons name="search" size={20} color={C.textoMuted} />
				<TextInput
					value={busqueda}
					onChangeText={setBusqueda}
					placeholder="Buscar comunidad..."
					placeholderTextColor={C.textoMuted}
					style={{ flex: 1, fontSize: 14, color: C.texto }}
				/>
				{busqueda.length > 0 && (
					<TouchableOpacity onPress={() => setBusqueda("")}>
						<MaterialIcons name="close" size={18} color={C.textoMuted} />
					</TouchableOpacity>
				)}
			</View>

			{/* Contador resultados */}
			{busqueda.length > 0 && (
				<Text style={{ fontSize: 12, color: C.textoMuted, marginBottom: 8 }}>
					{comunidadesFiltradas.length} resultado
					{comunidadesFiltradas.length !== 1 ? "s" : ""} para "{busqueda}"
				</Text>
			)}

			{/* Encabezado tabla */}
			<View
				style={{
					flexDirection: "row",
					paddingHorizontal: 14,
					paddingVertical: 8,
					backgroundColor: "#f9fafb",
					borderRadius: 8,
					marginBottom: 8,
					borderWidth: 1,
					borderColor: C.borde,
				}}
			>
				<Text style={{ flex: 1, fontSize: 10, fontWeight: "700", color: C.textoMuted, letterSpacing: 0.5 }}>
					COMUNIDAD
				</Text>
				<Text style={{ fontSize: 10, fontWeight: "700", color: C.textoMuted, letterSpacing: 0.5, marginRight: 60 }}>
					IRSU
				</Text>
				<Text style={{ fontSize: 10, fontWeight: "700", color: C.textoMuted, letterSpacing: 0.5 }}>
					ESTADO
				</Text>
			</View>

			{/* Lista */}
			<ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
				{isLoading && (
					<ActivityIndicator color={C.verde} style={{ marginTop: 20 }} />
				)}

				{!isLoading && comunidadesFiltradas.length === 0 && (
					<View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
						<MaterialIcons name="search-off" size={48} color={C.textoMuted} />
						<Text style={{ color: C.textoMuted }}>
							{busqueda.length > 0
								? `Sin resultados para "${busqueda}"`
								: "No hay comunidades registradas"}
						</Text>
					</View>
				)}

				{comunidadesFiltradas.map((com: any) => {
					const s = statusCfg(com.status);
					return (
						<View
							key={com.id}
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: 10,
								backgroundColor: C.blanco,
								borderRadius: 8,
								borderWidth: 1,
								borderColor: C.borde,
								padding: 12,
								marginBottom: 6,
							}}
						>
							<View
								style={{
									width: 9,
									height: 9,
									borderRadius: 99,
									backgroundColor: irsuColor(com.irsuActual),
								}}
							/>
							<View style={{ flex: 1 }}>
								<Text style={{ fontSize: 13.5, fontWeight: "600", color: C.texto }}>
									{com.nombre}
								</Text>
								<Text style={{ fontSize: 11, color: C.textoMuted }}>
									{com.municipio?.nombre}
								</Text>
							</View>
							<Text
								style={{
									fontSize: 15,
									fontWeight: "800",
									color: irsuColor(com.irsuActual),
									minWidth: 50,
									textAlign: "right",
								}}
							>
								{com.irsuActual?.toFixed(1)}
							</Text>
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: 5,
									backgroundColor: s.bg,
									paddingHorizontal: 9,
									paddingVertical: 3,
									borderRadius: 99,
									minWidth: 90,
									justifyContent: "center",
								}}
							>
								<View
									style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.dot }}
								/>
								<Text style={{ fontSize: 10, fontWeight: "700", color: s.text }}>
									{com.status}
								</Text>
							</View>
							{com.status === "PENDIENTE" && (
								<TouchableOpacity
									disabled={activando}
									onPress={() =>
										Alert.alert("Activar comunidad", `¿Activar "${com.nombre}"?`, [
											{ text: "Cancelar", style: "cancel" },
											{
												text: "Activar",
												onPress: () =>
													activar({ slug: com.slug, dto: { status: "ACTIVO" } }),
											},
										])
									}
									style={{
										backgroundColor: C.verde,
										paddingHorizontal: 14,
										paddingVertical: 6,
										borderRadius: 7,
									}}
								>
									<Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
										Activar
									</Text>
								</TouchableOpacity>
							)}
						</View>
					);
				})}

				<View style={{ height: 40 }} />
			</ScrollView>
		</View>
	);
}

// ─── Placeholder ──────────────────────────────────────────────────────────────
function Proximamente({
	icon,
	label,
}: {
	icon: React.ComponentProps<typeof MaterialIcons>["name"];
	label: string;
}) {
	return (
		<View
			style={{
				flex: 1,
				alignItems: "center",
				justifyContent: "center",
				gap: 12,
			}}
		>
			<MaterialIcons name={icon} size={56} color={C.textoMuted} />
			<Text style={{ fontSize: 20, fontWeight: "700", color: C.texto }}>{label}</Text>
			<Text style={{ fontSize: 14, color: C.textoMuted }}>Próximamente disponible</Text>
		</View>
	);
}

// ─── Panel Admin Principal ────────────────────────────────────────────────────
export function PanelAdmin() {
	const [tab, setTab] = useState<Tab>("dashboard");
	const usuario = useAuthStore((s) => s.usuario);
	const esWeb = Platform.OS === "web";

	return (
		<View
			style={{
				flex: 1,
				flexDirection: esWeb ? "row" : "column",
				backgroundColor: C.bg,
			}}
		>
			{esWeb && <Sidebar tab={tab} setTab={setTab} usuario={usuario} />}

			<View style={{ flex: 1, overflow: "hidden" as any }}>
				{/* Header móvil */}
				{!esWeb && (
					<View
						style={{
							paddingHorizontal: 20,
							paddingTop: 52,
							paddingBottom: 12,
							backgroundColor: C.verde,
						}}
					>
						<Text
							style={{
								fontSize: 22,
								fontWeight: "900",
								color: "#fff",
								letterSpacing: -0.5,
							}}
						>
							IRSU Admin
						</Text>
						<Text style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 2 }}>
							{usuario?.rol} · {usuario?.nombre ?? usuario?.email}
						</Text>
					</View>
				)}

				{esWeb && <TopBar tab={tab} usuario={usuario} />}

				{/* Tabs móvil */}
				{!esWeb && (
					<View
						style={{
							flexDirection: "row",
							backgroundColor: C.blanco,
							borderBottomWidth: 1,
							borderBottomColor: C.borde,
						}}
					>
						{(["reportes", "comunidades"] as Tab[]).map((t) => {
							const icon: React.ComponentProps<typeof MaterialIcons>["name"] =
								t === "reportes" ? "assessment" : "groups";
							return (
								<TouchableOpacity
									key={t}
									onPress={() => setTab(t)}
									style={{
										flex: 1,
										paddingVertical: 12,
										alignItems: "center",
										flexDirection: "row",
										justifyContent: "center",
										gap: 6,
										borderBottomWidth: tab === t ? 2 : 0,
										borderBottomColor: C.verde,
									}}
								>
									<MaterialIcons
										name={icon}
										size={18}
										color={tab === t ? C.verde : C.textoMuted}
									/>
									<Text
										style={{
											fontSize: 13,
											fontWeight: tab === t ? "700" : "500",
											color: tab === t ? C.verde : C.textoMuted,
										}}
									>
										{t === "reportes" ? "Reportes" : "Comunidades"}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>
				)}

				{/* Contenido */}
				<View style={{ flex: 1, padding: esWeb ? 28 : 14 }}>
					{tab === "dashboard"   && <SeccionDashboard />}
					{tab === "reportes"    && <SeccionReportes />}
					{tab === "comunidades" && <SeccionComunidades />}
					{tab === "cuadrillas"  && <SeccionCuadrillas />}
					{tab === "alertas"     && <Proximamente icon="notifications"   label="Alertas"  />}
					{tab === "usuarios"    && <Proximamente icon="manage-accounts" label="Usuarios" />}
				</View>
			</View>
		</View>
	);
}