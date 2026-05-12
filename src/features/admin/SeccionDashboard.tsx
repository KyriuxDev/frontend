import { useState, useMemo } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
} from "react-native";
import {
	Svg,
	Path,
	Circle,
	Defs,
	LinearGradient,
	Stop,
} from "react-native-svg";
import { useReportes } from "@/src/features/reportes/reporte.queries";
import {
	useDashboardStats,
	useRecalcularIrsu,
} from "@/src/features/admin/dashboard.queries";
import {
	ReporteResumen,
	EstadoReporte,
} from "@/src/features/reportes/reporte.types";
import { formatearFechaCorta } from "@/src/utils/formatDate";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
	verde: "#1d4e32",
	verdeHover: "#edf7f0",
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function buildPath(pts: { x: number; y: number }[]) {
	if (pts.length === 0) return "";
	return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
	label,
	value,
	topColor,
	barWidth,
}: {
	label: string;
	value: number | string;
	topColor: string;
	barWidth: number;
}) {
	return (
		<View
			style={{
				flex: 1,
				minWidth: 150,
				backgroundColor: C.blanco,
				borderRadius: 10,
				borderWidth: 1,
				borderColor: C.borde,
				borderTopWidth: 3,
				borderTopColor: topColor,
				padding: 16,
			}}
		>
			<Text
				style={{
					fontSize: 10,
					fontWeight: "700",
					color: C.textoMuted,
					letterSpacing: 0.6,
					textTransform: "uppercase",
					marginBottom: 12,
				}}
			>
				{label}
			</Text>
			<Text
				style={{
					fontSize: 32,
					fontWeight: "800",
					color: topColor,
					letterSpacing: -1,
					marginBottom: 12,
				}}
			>
				{value}
			</Text>
			<View
				style={{
					height: 3,
					backgroundColor: "#f1f5f1",
					borderRadius: 99,
					overflow: "hidden",
				}}
			>
				<View
					style={{
						height: 3,
						width: `${barWidth}%` as any,
						backgroundColor: topColor,
						borderRadius: 99,
					}}
				/>
			</View>
		</View>
	);
}

// ─── Gráfico IRSU ─────────────────────────────────────────────────────────────
function IrsuChart({
	periodo,
	setPeriodo,
	puntos,
	labelsX,
	maxPunto,
	minIrsuValor,  // ← nuevo
	maxIrsuValor,
	isLoading,
	onRecalcular,
	recalculando,
}: {
	periodo: "7D" | "30D" | "90D";
	setPeriodo: (p: "7D" | "30D" | "90D") => void;
	puntos: { x: number; y: number }[];
	labelsX: string[];
	maxPunto: { x: number; y: number } | null;
	minIrsuValor: number;  // ← nuevo
	maxIrsuValor: number;
	isLoading: boolean;
	onRecalcular: () => void;
	recalculando: boolean;
}) {
	const linePath = buildPath(puntos);
	const areaPath =
		puntos.length > 0
			? `${linePath} L${puntos[puntos.length - 1].x},300 L${puntos[0].x},300 Z`
			: "";

	// ── Labels Y dinámicos basados en el rango real de los datos ──
	const rango = Math.max(maxIrsuValor - minIrsuValor, 5);
	const step = rango / 5;
	const yLabels = [0, 1, 2, 3, 4, 5].map((i) =>
		Math.round(minIrsuValor + (5 - i) * step)
	);

	const tooltipRight = maxPunto && maxPunto.x > 700 ? "55%" : "18%";

	return (
		<View
			style={{
				backgroundColor: C.blanco,
				borderRadius: 10,
				borderWidth: 1,
				borderColor: C.borde,
				overflow: "hidden",
				marginBottom: 20,
			}}
		>
			{/* Header */}
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: 20,
					paddingVertical: 14,
					borderBottomWidth: 1,
					borderBottomColor: C.bordeLight,
					backgroundColor: "#fafcfa",
				}}
			>
				<View>
					<Text style={{ fontSize: 16, fontWeight: "700", color: C.verde }}>
						Índice IRSU en el tiempo
					</Text>
					<Text style={{ fontSize: 12, color: C.textoMuted, marginTop: 2 }}>
						Evolución del riesgo urbano — últimos{" "}
						{periodo === "7D" ? "7 días" : periodo === "30D" ? "30 días" : "90 días"}
					</Text>
				</View>

				<View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
					{/* Botón recalcular */}
					<TouchableOpacity
						onPress={onRecalcular}
						disabled={recalculando}
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: 6,
							paddingHorizontal: 12,
							paddingVertical: 6,
							borderRadius: 7,
							backgroundColor: recalculando ? C.verdeHover : C.verde,
							borderWidth: 1,
							borderColor: C.verde,
						}}
					>
						{recalculando ? (
							<ActivityIndicator size="small" color={C.verde} />
						) : (
							<Text style={{ fontSize: 13 }}>↻</Text>
						)}
						<Text
							style={{
								fontSize: 11,
								fontWeight: "700",
								color: recalculando ? C.verde : "#fff",
							}}
						>
							{recalculando ? "Calculando..." : "Recalcular"}
						</Text>
					</TouchableOpacity>

					{/* Selectores de periodo */}
					{(["7D", "30D", "90D"] as const).map((p) => (
						<TouchableOpacity
							key={p}
							onPress={() => setPeriodo(p)}
							style={{
								paddingHorizontal: 10,
								paddingVertical: 5,
								borderRadius: 6,
								backgroundColor: periodo === p ? C.verde : C.blanco,
								borderWidth: 1,
								borderColor: periodo === p ? C.verde : C.borde,
							}}
						>
							<Text
								style={{
									fontSize: 11,
									fontWeight: "700",
									color: periodo === p ? "#fff" : C.textoMuted,
								}}
							>
								{p}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>

			{/* Chart body */}
			<View style={{ padding: 16, height: 280 }}>
				{/* Labels eje Y */}
				<View
					style={{
						position: "absolute",
						left: 16,
						top: 16,
						bottom: 32,
						justifyContent: "space-between",
					}}
				>
					{yLabels.map((l, i) => (
						<Text
							key={i}
							style={{
								fontSize: 10,
								color: C.textoMuted,
								width: 28,
								textAlign: "right",
							}}
						>
							{l}
						</Text>
					))}
				</View>

				<View style={{ marginLeft: 36, marginBottom: 20, flex: 1 }}>
					{isLoading ? (
						<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
							<ActivityIndicator color={C.verde} />
						</View>
					) : puntos.length < 2 ? (
						<View
							style={{
								flex: 1,
								alignItems: "center",
								justifyContent: "center",
								gap: 12,
							}}
						>
							<Text style={{ color: C.textoMuted, fontSize: 13 }}>
								Sin datos para este periodo
							</Text>
							<TouchableOpacity
								onPress={onRecalcular}
								disabled={recalculando}
								style={{
									backgroundColor: C.verde,
									borderRadius: 8,
									paddingHorizontal: 20,
									paddingVertical: 8,
									flexDirection: "row",
									alignItems: "center",
									gap: 6,
								}}
							>
								{recalculando ? (
									<ActivityIndicator size="small" color="#fff" />
								) : (
									<Text style={{ fontSize: 14 }}>↻</Text>
								)}
								<Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
									{recalculando ? "Calculando..." : "Generar datos IRSU"}
								</Text>
							</TouchableOpacity>
							<Text
								style={{
									color: C.textoMuted,
									fontSize: 11,
									textAlign: "center",
									maxWidth: 260,
								}}
							>
								Presiona para calcular el índice IRSU de todas las comunidades activas
							</Text>
						</View>
					) : (
						<>
							<Svg width={900} height={240} viewBox="0 0 1000 300">
								<Defs>
									<LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
										<Stop offset="0%" stopColor={C.verde} stopOpacity={0.15} />
										<Stop offset="100%" stopColor={C.verde} stopOpacity={0} />
									</LinearGradient>
								</Defs>
								{[0, 60, 120, 180, 240, 300].map((y) => (
									<Path
										key={y}
										d={`M0,${y} H1000`}
										stroke="#f0f4f0"
										strokeWidth="1"
									/>
								))}
								<Path d={areaPath} fill="url(#grad)" />
								<Path
									d={linePath}
									fill="none"
									stroke={C.verde}
									strokeWidth="2.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								{puntos
									.filter((_, i) => i % 2 === 0)
									.map((pt, i) => (
										<Circle
											key={i}
											cx={pt.x}
											cy={pt.y}
											r="5"
											fill={C.verde}
											stroke="#fff"
											strokeWidth="2"
										/>
									))}
								{maxPunto && (
									<Circle
										cx={maxPunto.x}
										cy={maxPunto.y}
										r="6"
										fill="#dc2626"
										stroke="#fff"
										strokeWidth="2"
									/>
								)}
							</Svg>

							{maxPunto && maxIrsuValor > 0 && (
								<View
									style={{
										position: "absolute",
										right: tooltipRight,
										top: `${Math.max(5, (maxPunto.y / 300) * 80)}%`,
										backgroundColor:
											maxIrsuValor > 100
												? "#dc2626"
												: maxIrsuValor > 50
													? "#d97706"
													: C.verde,
										borderRadius: 8,
										paddingHorizontal: 10,
										paddingVertical: 6,
									}}
								>
									<Text
										style={{
											color: "#fff",
											fontSize: 12,
											fontWeight: "700",
											fontFamily: "monospace",
										}}
									>
										IRSU: {maxIrsuValor.toFixed(1)}
									</Text>
									<Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>
										{maxIrsuValor > 100
											? "⚠ Alerta Roja"
											: maxIrsuValor > 50
												? "⚠ Alerta Amarilla"
												: "✓ Normal"}
									</Text>
								</View>
							)}
						</>
					)}
				</View>

				{/* Labels eje X */}
				<View
					style={{
						flexDirection: "row",
						justifyContent: "space-around",
						marginLeft: 36,
					}}
				>
					{labelsX.map((m, i) => (
						<Text key={i} style={{ fontSize: 10, color: C.textoMuted }}>
							{m}
						</Text>
					))}
				</View>
			</View>
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
			<View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.dot }} />
			<Text style={{ fontSize: 11, fontWeight: "700", color: c.text }}>{c.label}</Text>
		</View>
	);
}

// ─── Categoría tag ────────────────────────────────────────────────────────────
function CatTag({ categoria }: { categoria: string }) {
	const colors: Record<string, { bg: string; text: string; border: string }> = {
		INFRAESTRUCTURA: { bg: "#eff6ff", text: "#1d4ed8", border: "#3b82f6" },
		VIALIDAD: { bg: "#fffbeb", text: "#b45309", border: "#d97706" },
		BLOQUEOS: { bg: "#fdf2f8", text: "#9d174d", border: "#db2777" },
		SEGURIDAD: { bg: "#f0fdf4", text: "#166534", border: "#22c55e" },
	};
	const c = colors[categoria] ?? { bg: "#f1f5f9", text: "#64748b", border: "#94a3b8" };
	return (
		<View
			style={{
				borderLeftWidth: 2,
				borderLeftColor: c.border,
				backgroundColor: c.bg,
				paddingHorizontal: 8,
				paddingVertical: 3,
				borderRadius: 2,
			}}
		>
			<Text style={{ fontSize: 11, fontWeight: "600", color: c.text }}>{categoria}</Text>
		</View>
	);
}

// ─── Estrellas ────────────────────────────────────────────────────────────────
function Estrellas({ n }: { n: number }) {
	return (
		<View style={{ flexDirection: "row", gap: 1 }}>
			{[1, 2, 3, 4, 5].map((i) => (
				<Text key={i} style={{ fontSize: 13, color: i <= n ? "#f59e0b" : "#e2e8f0" }}>
					★
				</Text>
			))}
		</View>
	);
}

// ─── Tabla reportes recientes ─────────────────────────────────────────────────
function TablaReportes({
	reportes,
	isLoading,
}: {
	reportes: ReporteResumen[];
	isLoading: boolean;
}) {
	const recientes = reportes.slice(0, 5);

	return (
		<View
			style={{
				backgroundColor: C.blanco,
				borderRadius: 10,
				borderWidth: 1,
				borderColor: C.borde,
				overflow: "hidden",
			}}
		>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: 20,
					paddingVertical: 14,
					borderBottomWidth: 1,
					borderBottomColor: C.bordeLight,
				}}
			>
				<Text style={{ fontSize: 16, fontWeight: "700", color: C.verde }}>
					Reportes Recientes
				</Text>
			</View>

			<View
				style={{
					flexDirection: "row",
					backgroundColor: "#f9fafb",
					paddingHorizontal: 20,
					paddingVertical: 10,
					borderBottomWidth: 1,
					borderBottomColor: C.bordeLight,
				}}
			>
				{[
					{ label: "TÍTULO", flex: 2.5 },
					{ label: "CATEGORÍA", flex: 1.5 },
					{ label: "COMUNIDAD", flex: 1.5 },
					{ label: "GRAVEDAD", flex: 1 },
					{ label: "ESTADO", flex: 1.5 },
					{ label: "FECHA", flex: 1 },
				].map((col) => (
					<Text
						key={col.label}
						style={{
							flex: col.flex,
							fontSize: 10,
							fontWeight: "700",
							color: C.textoMuted,
							letterSpacing: 0.6,
						}}
					>
						{col.label}
					</Text>
				))}
			</View>

			{isLoading && (
				<View style={{ alignItems: "center", paddingVertical: 32 }}>
					<ActivityIndicator color={C.verde} />
				</View>
			)}

			{recientes.map((r, idx) => (
				<View
					key={r.id}
					style={{
						flexDirection: "row",
						alignItems: "center",
						paddingHorizontal: 20,
						paddingVertical: 12,
						borderBottomWidth: idx < recientes.length - 1 ? 1 : 0,
						borderBottomColor: C.bordeLight,
					}}
				>
					<View style={{ flex: 2.5 }}>
						<Text
							style={{ fontSize: 13, fontWeight: "700", color: C.verde }}
							numberOfLines={1}
						>
							{r.titulo}
						</Text>
						<Text style={{ fontSize: 11, color: C.textoMuted, marginTop: 1 }}>
							ID: #RE-{String(r.id).padStart(4, "0")}
						</Text>
					</View>
					<View style={{ flex: 1.5 }}>
						<CatTag categoria={r.categoria} />
					</View>
					<Text style={{ flex: 1.5, fontSize: 13, color: C.textoSub }} numberOfLines={1}>
						{r.comunidad.nombre}
					</Text>
					<View style={{ flex: 1 }}>
						<Estrellas n={r.gravedad} />
					</View>
					<View style={{ flex: 1.5 }}>
						<ChipEstado estado={r.estado} />
					</View>
					<Text style={{ flex: 1, fontSize: 12, color: C.textoMuted, fontFamily: "monospace" }}>
						{formatearFechaCorta(r.createdAt)}
					</Text>
				</View>
			))}

			{!isLoading && recientes.length === 0 && (
				<View style={{ alignItems: "center", paddingVertical: 32 }}>
					<Text style={{ color: C.textoMuted }}>No hay reportes recientes</Text>
				</View>
			)}

			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: 20,
					paddingVertical: 10,
					borderTopWidth: 1,
					borderTopColor: C.bordeLight,
					backgroundColor: "#fafcfa",
				}}
			>
				<Text style={{ fontSize: 12, color: C.textoMuted }}>
					Mostrando {recientes.length} reportes recientes
				</Text>
			</View>
		</View>
	);
}

// ─── SeccionDashboard ─────────────────────────────────────────────────────────
export function SeccionDashboard() {
	const [periodo, setPeriodo] = useState<"7D" | "30D" | "90D">("30D");

	const { data: dashData, isLoading: loadingDash } = useDashboardStats(periodo);
	const { data: reportesData, isLoading: loadingReportes } = useReportes({ limit: 100 } as any);
	const { mutate: recalcular, isPending: recalculando } = useRecalcularIrsu();

	const kpis = dashData?.kpis;
	const serie = dashData?.serie ?? [];
	const reportes = reportesData?.data ?? [];

	// ── Puntos de la gráfica escalados al rango real min/max ──────────────────
	const puntosGrafica = useMemo(() => {
		if (serie.length === 0) return [];
		const serieNormalizada = serie.length === 1 ? [serie[0], serie[0]] : serie;

		const valores = serieNormalizada.map((s) => s.irsu);
		const minIrsu = Math.min(...valores);
		const maxIrsu = Math.max(...valores);
		const rango = Math.max(maxIrsu - minIrsu, 5); // mínimo rango de 5

		return serieNormalizada.map((s, i) => ({
			x: Math.round((i / (serieNormalizada.length - 1)) * 1000),
			y: Math.round(300 - ((s.irsu - minIrsu) / rango) * 260),
		}));
	}, [serie]);

	const labelsX = useMemo(() => {
		if (serie.length === 0) return [];
		const paso = Math.max(1, Math.floor(serie.length / 6));
		const items =
			serie.length === 1
				? [serie[0], serie[0]]
				: serie.filter((_, i) => i % paso === 0).slice(0, 7);
		return items.map((s) =>
			new Date(s.fecha).toLocaleDateString("es-MX", {
				day: "2-digit",
				month: "short",
			})
		);
	}, [serie]);

	const maxPunto = useMemo(() => {
		if (puntosGrafica.length === 0) return null;
		return puntosGrafica.reduce((max, p) => (p.y < max.y ? p : max));
	}, [puntosGrafica]);

	// ── Min y max del valor real IRSU para labels del eje Y ───────────────────
	const minIrsuValor = serie.length > 0 ? Math.min(...serie.map((s) => s.irsu)) : 0;
	const maxIrsuValor = serie.length > 0 ? Math.max(...serie.map((s) => s.irsu)) : 0;

	const handleRecalcular = () => {
		console.log("Recalculando IRSU para todas las comunidades...");
		recalcular();
	};

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			{/* KPI Cards */}
			<View style={{ flexDirection: "row", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
				<KpiCard
					label="Total Reportes"
					value={loadingDash ? "..." : (kpis?.totalReportes ?? 0)}
					topColor={C.verde}
					barWidth={100}
				/>
				<KpiCard
					label="Pendientes"
					value={loadingDash ? "..." : (kpis?.pendientes ?? 0)}
					topColor={C.amberDot}
					barWidth={
						kpis ? Math.round((kpis.pendientes / Math.max(kpis.totalReportes, 1)) * 100) : 0
					}
				/>
				<KpiCard
					label="En Proceso"
					value={loadingDash ? "..." : (kpis?.enProceso ?? 0)}
					topColor={C.azulDot}
					barWidth={
						kpis ? Math.round((kpis.enProceso / Math.max(kpis.totalReportes, 1)) * 100) : 0
					}
				/>
				<KpiCard
					label="Resueltos"
					value={loadingDash ? "..." : (kpis?.resueltos ?? 0)}
					topColor="#16a34a"
					barWidth={
						kpis ? Math.round((kpis.resueltos / Math.max(kpis.totalReportes, 1)) * 100) : 0
					}
				/>
			</View>

			{/* Gráfica IRSU */}
			<IrsuChart
				periodo={periodo}
				setPeriodo={setPeriodo}
				puntos={puntosGrafica}
				labelsX={labelsX}
				maxPunto={maxPunto}
				minIrsuValor={minIrsuValor}
				maxIrsuValor={maxIrsuValor}
				isLoading={loadingDash}
				onRecalcular={handleRecalcular}
				recalculando={recalculando}
			/>

			{/* Tabla reportes recientes */}
			<TablaReportes reportes={reportes} isLoading={loadingReportes} />

			<View style={{ height: 40 }} />
		</ScrollView>
	);
}