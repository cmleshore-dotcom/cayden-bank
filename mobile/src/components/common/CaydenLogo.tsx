import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';
import { LinearGradient as LG } from 'expo-linear-gradient';
import { shadows } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../stores/authStore';

interface CaydenLogoProps {
  size?: number;
  showBackground?: boolean;
}

export function CaydenLogo({ size = 110, showBackground = true }: CaydenLogoProps) {
  const isDarkMode = useAuthStore((s) => s.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;
  const svgSize = size * 0.7;

  const logo = (
    <Svg width={svgSize} height={svgSize} viewBox="0 0 100 100">
      {/* Reddish-Apricot Goldendoodle — based on real photo */}
      <G>
        {/* ===== EARS (behind head) ===== */}
        {/* Left ear - floppy, long, darker */}
        <Ellipse cx="20" cy="48" rx="13" ry="20" fill="#8B4A1F" transform="rotate(-12, 20, 48)" />
        <Ellipse cx="21" cy="50" rx="9" ry="15" fill="#A65E2A" transform="rotate(-12, 21, 50)" />
        {/* Right ear - floppy, long, darker */}
        <Ellipse cx="80" cy="48" rx="13" ry="20" fill="#8B4A1F" transform="rotate(12, 80, 48)" />
        <Ellipse cx="79" cy="50" rx="9" ry="15" fill="#A65E2A" transform="rotate(12, 79, 50)" />

        {/* ===== HEAD BASE — dense curly fur ===== */}
        <Circle cx="50" cy="48" r="33" fill="#C47A3A" />

        {/* ===== CURLY FUR TEXTURE — top of head ===== */}
        {/* Top crown curls */}
        <Circle cx="50" cy="14" r="11" fill="#B86D30" />
        <Circle cx="38" cy="17" r="10" fill="#C47A3A" />
        <Circle cx="62" cy="17" r="10" fill="#C47A3A" />
        <Circle cx="44" cy="12" r="8" fill="#D88A45" />
        <Circle cx="56" cy="12" r="8" fill="#D88A45" />
        <Circle cx="50" cy="10" r="7" fill="#C47A3A" />
        {/* Upper sides */}
        <Circle cx="28" cy="24" r="10" fill="#B86D30" />
        <Circle cx="72" cy="24" r="10" fill="#B86D30" />
        <Circle cx="34" cy="19" r="8" fill="#C47A3A" />
        <Circle cx="66" cy="19" r="8" fill="#C47A3A" />
        {/* Mid sides — dense curls */}
        <Circle cx="22" cy="36" r="10" fill="#C47A3A" />
        <Circle cx="78" cy="36" r="10" fill="#C47A3A" />
        <Circle cx="18" cy="44" r="8" fill="#B86D30" />
        <Circle cx="82" cy="44" r="8" fill="#B86D30" />
        {/* Lower side curls */}
        <Circle cx="24" cy="52" r="8" fill="#C47A3A" />
        <Circle cx="76" cy="52" r="8" fill="#C47A3A" />
        {/* Extra fluff highlights */}
        <Circle cx="42" cy="15" r="6" fill="#D88A45" />
        <Circle cx="58" cy="15" r="6" fill="#D88A45" />
        <Circle cx="30" cy="30" r="6" fill="#D88A45" />
        <Circle cx="70" cy="30" r="6" fill="#D88A45" />

        {/* ===== BROW FLUFF — curls over eyes ===== */}
        <Circle cx="36" cy="34" r="7" fill="#C47A3A" />
        <Circle cx="64" cy="34" r="7" fill="#C47A3A" />
        <Circle cx="42" cy="32" r="6" fill="#D88A45" />
        <Circle cx="58" cy="32" r="6" fill="#D88A45" />
        <Circle cx="50" cy="30" r="6" fill="#C47A3A" />

        {/* ===== CHEEK FLUFF ===== */}
        <Circle cx="30" cy="56" r="8" fill="#C47A3A" />
        <Circle cx="70" cy="56" r="8" fill="#C47A3A" />
        <Circle cx="34" cy="60" r="6" fill="#D88A45" />
        <Circle cx="66" cy="60" r="6" fill="#D88A45" />

        {/* ===== MUZZLE AREA — lighter warm copper ===== */}
        <Circle cx="50" cy="54" r="17" fill="#D4956A" />
        <Circle cx="50" cy="50" r="12" fill="#DABA8A" />

        {/* ===== EYES — big, dark, soulful ===== */}
        {/* Left eye */}
        <Circle cx="39" cy="42" r="5.5" fill="#1A0F06" />
        <Circle cx="41" cy="40" r="2" fill="#FFFFFF" />
        <Circle cx="37.5" cy="43" r="0.8" fill="#FFFFFF" opacity="0.4" />
        {/* Right eye */}
        <Circle cx="61" cy="42" r="5.5" fill="#1A0F06" />
        <Circle cx="63" cy="40" r="2" fill="#FFFFFF" />
        <Circle cx="59.5" cy="43" r="0.8" fill="#FFFFFF" opacity="0.4" />

        {/* ===== EYEBROWS — fluffy fur arches ===== */}
        <Path d="M32 36 Q36 32 42 34" stroke="#A65E2A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Path d="M58 34 Q64 32 68 36" stroke="#A65E2A" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* ===== NOSE — large, dark, prominent ===== */}
        <Ellipse cx="50" cy="53" rx="6.5" ry="4.5" fill="#1A0F06" />
        {/* Nose shine */}
        <Ellipse cx="48" cy="51.5" rx="2" ry="1.2" fill="#3D2815" />
        <Circle cx="52" cy="51" r="0.8" fill="#3D2815" />

        {/* ===== MOUTH — subtle grin, no tongue ===== */}
        <Path d="M50 57.5 Q43 63 38 59" stroke="#6B3A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <Path d="M50 57.5 Q57 63 62 59" stroke="#6B3A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Slight lip line for the grin */}
        <Path d="M44 60 Q47 62 50 61 Q53 62 56 60" stroke="#6B3A1A" strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* ===== CHIN BEARD FLUFF ===== */}
        <Circle cx="50" cy="68" r="8" fill="#C47A3A" />
        <Circle cx="42" cy="66" r="6" fill="#D88A45" />
        <Circle cx="58" cy="66" r="6" fill="#D88A45" />
        <Circle cx="50" cy="72" r="5" fill="#B86D30" />
        <Circle cx="44" cy="70" r="4" fill="#C47A3A" />
        <Circle cx="56" cy="70" r="4" fill="#C47A3A" />
      </G>
    </Svg>
  );

  if (showBackground) {
    return (
      <View style={[{ borderRadius: size / 2 }, shadows.lg]}>
        <LG
          colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.background,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          {logo}
        </LG>
      </View>
    );
  }

  return logo;
}

const styles = StyleSheet.create({
  background: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
