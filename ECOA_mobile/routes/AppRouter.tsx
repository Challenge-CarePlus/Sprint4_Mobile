import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "../pages/Login";
import Main from "../pages/Main";

import { useAuth } from "../context/AuthContext";

const Stack = createNativeStackNavigator();

export default function AppRouter() {
  const { token, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {token ? (
          <Stack.Screen
            name="MAIN"
            component={Main}
          />
        ) : (
          <Stack.Screen
            name="LOGIN"
            component={Login}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}