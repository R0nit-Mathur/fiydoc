import { Platform, processColor, type ViewStyle } from 'react-native';

type NativeShadow = Pick<ViewStyle, 'shadowOffset' | 'shadowRadius' | 'elevation'> & {
  shadowColor: string;
  shadowOpacity?: number;
};

/** Keep native shadows unchanged; emit only supported boxShadow styles on web. */
export function platformShadow(shadow: NativeShadow): ViewStyle {
  if (Platform.OS !== 'web') return shadow;

  const color = processColor(shadow.shadowColor);
  if (typeof color !== 'number') return {};

  const red = (color >>> 16) & 255;
  const green = (color >>> 8) & 255;
  const blue = color & 255;
  const alpha = ((color >>> 24) / 255) * (shadow.shadowOpacity ?? 1);
  const { width = 0, height = 0 } = shadow.shadowOffset ?? {};

  return {
    boxShadow: `${width}px ${height}px ${shadow.shadowRadius ?? 0}px rgba(${red}, ${green}, ${blue}, ${alpha})`,
  };
}
