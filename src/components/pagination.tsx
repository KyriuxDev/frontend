import { MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text } from "react-native";

const C = {
	verde: "#1d4e32",
	verdeHover: "#edf7f0",
	borde: "#e8ede8",
	textoSub: "#4a5e4a",
	textoMuted: "#9aaa9a",
};

export function Paginacion({
	page,
	totalPages,
	onPrev,
	onNext,
}: {
	page: number;
	totalPages: number;
	onPrev: () => void;
	onNext: () => void;
}) {
	if (totalPages <= 1) return null;

	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "center",
				gap: 12,
				paddingVertical: 16,
			}}
		>
			<TouchableOpacity
				onPress={onPrev}
				disabled={page <= 1}
				style={{
					flexDirection: "row",
					alignItems: "center",
					gap: 4,
					paddingHorizontal: 16,
					paddingVertical: 8,
					borderRadius: 8,
					borderWidth: 1,
					borderColor: page <= 1 ? C.borde : C.verde,
					backgroundColor: page <= 1 ? "#f9fafb" : C.verdeHover,
					opacity: page <= 1 ? 0.5 : 1,
				}}
			>
				<MaterialIcons
					name="chevron-left"
					size={18}
					color={page <= 1 ? C.textoMuted : C.verde}
				/>
				<Text
					style={{
						fontSize: 13,
						fontWeight: "600",
						color: page <= 1 ? C.textoMuted : C.verde,
					}}
				>
					Anterior
				</Text>
			</TouchableOpacity>

			<Text style={{ fontSize: 13, color: C.textoSub, fontWeight: "600" }}>
				{page} / {totalPages}
			</Text>

			<TouchableOpacity
				onPress={onNext}
				disabled={page >= totalPages}
				style={{
					flexDirection: "row",
					alignItems: "center",
					gap: 4,
					paddingHorizontal: 16,
					paddingVertical: 8,
					borderRadius: 8,
					borderWidth: 1,
					borderColor: page >= totalPages ? C.borde : C.verde,
					backgroundColor: page >= totalPages ? "#f9fafb" : C.verdeHover,
					opacity: page >= totalPages ? 0.5 : 1,
				}}
			>
				<Text
					style={{
						fontSize: 13,
						fontWeight: "600",
						color: page >= totalPages ? C.textoMuted : C.verde,
					}}
				>
					Siguiente
				</Text>
				<MaterialIcons
					name="chevron-right"
					size={18}
					color={page >= totalPages ? C.textoMuted : C.verde}
				/>
			</TouchableOpacity>
		</View>
	);
}
