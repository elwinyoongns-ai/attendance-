import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/DashboardScreen';
import MembersScreen from '../screens/MembersScreen';
import MemberFormScreen from '../screens/MemberFormScreen';
import MemberDetailScreen from '../screens/MemberDetailScreen';
import ServicesScreen from '../screens/ServicesScreen';
import ServiceFormScreen from '../screens/ServiceFormScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator();
const MemberStack = createNativeStackNavigator();
const ServiceStack = createNativeStackNavigator();

const PRIMARY = '#2563eb';

function MembersStack() {
  return (
    <MemberStack.Navigator screenOptions={{ headerStyle: { backgroundColor: PRIMARY }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }}>
      <MemberStack.Screen name="MembersList" component={MembersScreen} options={{ title: 'Members' }} />
      <MemberStack.Screen name="MemberForm" component={MemberFormScreen} options={({ route }) => ({ title: route.params?.member ? 'Edit Member' : 'Add Member' })} />
      <MemberStack.Screen name="MemberDetail" component={MemberDetailScreen} options={{ title: 'Member Profile' }} />
    </MemberStack.Navigator>
  );
}

function ServicesStack() {
  return (
    <ServiceStack.Navigator screenOptions={{ headerStyle: { backgroundColor: PRIMARY }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }}>
      <ServiceStack.Screen name="ServicesList" component={ServicesScreen} options={{ title: 'Services' }} />
      <ServiceStack.Screen name="ServiceForm" component={ServiceFormScreen} options={{ title: 'New Service' }} />
      <ServiceStack.Screen name="Attendance" component={AttendanceScreen} options={{ title: 'Take Attendance' }} />
    </ServiceStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 12 },
        headerStyle: { backgroundColor: PRIMARY },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'speedometer-outline',
            Members: 'people-outline',
            Services: 'calendar-outline',
            Reports: 'bar-chart-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Members" component={MembersStack} options={{ headerShown: false }} />
      <Tab.Screen name="Services" component={ServicesStack} options={{ headerShown: false }} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}
