import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { LayoutDashboard, BarChart3, Inbox, FileText } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#808080',
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <LayoutDashboard size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          tabBarIcon: ({ color }) => (
            <BarChart3 size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clearing"
        options={{
          tabBarIcon: ({ color }) => (
            <Inbox size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          tabBarIcon: ({ color }) => (
            <FileText size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 24,
    right: 24,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
