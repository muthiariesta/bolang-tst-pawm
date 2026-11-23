import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import AppText from './AppText';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { RADIUS } from '../theme/spacing';
import { projectPoints, smoothPath } from '../utils/geo';

// Peta skematik rute satu hari (seperti desain Figma): titik-titik stop diproyeksikan dari
// koordinat asli, dihubungkan garis putus-putus. Stop yang dikunci berwarna ungu.
// Lebar mengikuti container (onLayout) → responsif di HP maupun tablet.
export default function RouteMap({ stops = [], height = 168 }) {
  const [width, setWidth] = useState(0);
  const points = stops
    .map((s) => ({ lat: s.place_snapshot?.lat, lon: s.place_snapshot?.lon, locked: s.locked }))
    .filter((p) => p.lat != null && p.lon != null);
  const projected = width ? projectPoints(points, width, height) : [];

  return (
    <View style={[styles.box, { height }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityLabel={`Peta rute ${stops.length} stop`}>
      {points.length === 0 ? (
        <AppText variant="bodySm" color="muted" align="center">
          Koordinat stop belum tersedia
        </AppText>
      ) : width ? (
        <Svg width={width} height={height}>
          {projected.length > 1 ? (
            <Path d={smoothPath(projected)} stroke={COLORS.primary} strokeWidth={4} strokeDasharray="1 11" strokeLinecap="round" fill="none" />
          ) : null}
          {projected.map((p, i) => {
            const isLast = i === projected.length - 1 && projected.length > 1;
            const fill = p.locked || isLast ? COLORS.accent : COLORS.primary;
            return [
              <Circle key={`c${i}`} cx={p.x} cy={p.y} r={13} fill={fill} />,
              <SvgText key={`t${i}`} x={p.x} y={p.y + 4.5} fill={COLORS.white} fontSize={13} fontFamily={FONTS.bold} fontWeight="700" textAnchor="middle">
                {String(i + 1)}
              </SvgText>,
            ];
          })}
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%', borderRadius: RADIUS.lg - 4, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
