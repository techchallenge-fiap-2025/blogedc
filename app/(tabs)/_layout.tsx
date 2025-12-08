import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, usePathname, router } from "expo-router";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { APP_CONFIG } from "@/src/constants/config";
import { useAuth } from "@/src/contexts/AuthContext";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
  size?: number;
}) {
  return <FontAwesome size={props.size || 24} {...props} />;
}

export default function TabLayout() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isHomeScreen = pathname === "/";
  const isProfessor = user?.userType === "professor";
  const isAdmin = user?.userType === "admin";
  const canCreatePosts = isProfessor || isAdmin;
  const canManageUsers = isAdmin;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: APP_CONFIG.PRIMARY_COLOR,
          tabBarInactiveTintColor: "#999",
          tabBarStyle: {
            backgroundColor: "#FFF",
            borderWidth: 1,
            borderColor: "#E0E0E0",
            height: 60,
            paddingBottom: 10,
            paddingTop: 12,
            paddingHorizontal: 30,
            borderRadius: 20,
            marginHorizontal: 16,
            marginBottom: 16,
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 5,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={[styles.tabIconContainer, focused && styles.activeTab]}
              >
                <TabBarIcon
                  name="home"
                  color={focused ? "#FFF" : color}
                  size={20}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="two"
          options={{
            title: "",
            href: canManageUsers ? "/two" : null, // Oculta a aba se não for admin
            tabBarIcon: ({ color, focused }) => (
              <View
                style={[styles.tabIconContainer, focused && styles.activeTab]}
              >
                <TabBarIcon
                  name="users"
                  color={focused ? "#FFF" : color}
                  size={20}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={[styles.tabIconContainer, focused && styles.activeTab]}
              >
                <TabBarIcon
                  name="user"
                  color={focused ? "#FFF" : color}
                  size={20}
                />
              </View>
            ),
          }}
        />
      </Tabs>

      {/* Botão flutuante - apenas na home screen e para professores/admins */}
      {isHomeScreen && canCreatePosts && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/create-post")}
        >
          <FontAwesome name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  tabIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -5,
  },
  activeTab: {
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
  },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
