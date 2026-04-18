import Svg, { Path } from "react-native-svg";
import { Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

const TopographicBackground = () => (
  <Svg
    style={StyleSheet.absoluteFill}
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
  >
    <Path d={`M0,0 L${width},0 L${width},${height} L0,${height} Z`} fill="#79e0beff" />
    
    {[...Array(15)].map((_, i) => (
      <Path
        key={i}
        d={`M${-50 + i * 30},${50 + i * 25} 
            Q${width * 0.3},${40 + i * 22} ${width * 0.5},${60 + i * 28}
            T${width + 50},${45 + i * 25}`}
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="1.5"
        fill="none"
      />
    ))}
    
    {[...Array(12)].map((_, i) => (
      <Path
        key={`c2-${i}`}
        d={`M${-30},${80 + i * 30} 
            Q${width * 0.25},${100 + i * 28} ${width * 0.6},${70 + i * 32}
            T${width + 30},${90 + i * 30}`}
        stroke="rgba(200, 255, 233, 0.18)"
        strokeWidth="1"
        fill="none"
      />
    ))}

    <Path
      d={`M${width * 0.7},${height * 0.08} 
          Q${width * 0.85},${height * 0.12} ${width * 0.8},${height * 0.22}
          Q${width * 0.75},${height * 0.28} ${width * 0.9},${height * 0.25}`}
      stroke="rgba(255, 255, 255, 0.29)"
      strokeWidth="2"
      fill="none"
    />

    <Path
      d={`M0,${height * 0.22} 
          Q${width * 0.3},${height * 0.18} ${width * 0.5},${height * 0.24}
          Q${width * 0.7},${height * 0.30} ${width},${height * 0.20}
          L${width},${height} L0,${height} Z`}
      fill="#FFFFFF"
    />
  </Svg>
);

export default TopographicBackground;