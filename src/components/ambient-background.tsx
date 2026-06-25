import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

export function AmbientBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Base gradient image background */}
      <Image 
        source={require('@/assets/images/background-gradient.jpg')} 
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* Soft overlay to blend and dim the gradient for high text contrast */}
      <View style={styles.overlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Dim slightly to keep text contrast high
  },
});
