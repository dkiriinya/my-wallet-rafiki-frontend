import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { LayoutDashboard, BarChart3, Inbox, Layers } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#808080',
        tabBarStyle: [
          styles.tabBar,
          {
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
          }
        ],
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 9,
          fontWeight: '600',
          marginBottom: insets.bottom > 0 ? 0 : 6,
        },
        tabBarIconStyle: {
          marginTop: insets.bottom > 0 ? 6 : 4,
        },
        tabBarBackground: () => (
          <GlassView
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 0,
              backgroundColor: Platform.select({
                ios: 'rgba(10, 10, 10, 0.5)',
                default: 'rgba(10, 10, 10, 0.85)',
              }),
              overflow: 'hidden',
            }}
            glassEffectStyle="clear"
            colorScheme="dark"
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <LayoutDashboard size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          tabBarLabel: 'Trends',
          tabBarIcon: ({ color }) => (
            <BarChart3 size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clearing"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          tabBarLabel: 'Budgets',
          tabBarIcon: ({ color }) => (
            <Layers size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
  },
});
