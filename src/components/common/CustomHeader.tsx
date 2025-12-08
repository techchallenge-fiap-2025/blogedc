import React from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, StatusBar, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { APP_CONFIG } from "@/src/constants/config";

interface CustomHeaderProps {
  title: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showSearch?: boolean;
  onLogout?: () => void;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  searchQuery = "",
  onSearchChange,
  showSearch = true,
  onLogout,
}) => {
  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#FF6B35"
        translucent={false}
      />
      <LinearGradient
        colors={["#FF6B35", "#FF8A65"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{title}</Text>
        {showSearch && (
          <View style={styles.searchContainer}>
            <FontAwesome
              name="search"
              size={16}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar ..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={onSearchChange}
            />
          </View>
        )}
        {onLogout && (
          <TouchableOpacity
            style={styles.logoutIcon}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <FontAwesome name="sign-out" size={24} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : (StatusBar.currentHeight || 20), // Cobre a área da status bar
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    flex: 1,
  },
  logoutIcon: {
    padding: 8,
    marginLeft: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    marginLeft: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
});
