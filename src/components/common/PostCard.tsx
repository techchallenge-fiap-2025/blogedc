import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { router } from "expo-router";
import { Post } from "../../types";
import { APP_CONFIG } from "../../constants/config";
import { buildImageUrl } from "../../utils/imageUtils";
import FontAwesome from "@expo/vector-icons/FontAwesome";

interface PostCardProps extends TouchableOpacityProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onAuthorPress?: (authorId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onAuthorPress,
  ...props
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const handleAuthorPress = (e: any) => {
    e.stopPropagation(); // Prevenir que o clique no card também seja acionado
    const authorId = (post.author as any)._id || post.author._id;
    if (authorId) {
      if (onAuthorPress) {
        onAuthorPress(authorId);
      } else {
        // Fallback: navegar diretamente se não houver callback
        router.push(`/profile/${authorId}`);
      }
    }
  };

  return (
    <TouchableOpacity style={styles.container} {...props}>
      <View style={styles.cardContent}>
        {/* Imagem à esquerda */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: (() => {
                const imagePath = post.imageSrc || post.image;
                console.log(`🔍 PostCard - Post ${post.id} - imagePath original:`, imagePath?.substring(0, 100));
                console.log(`🔍 PostCard - Post ${post.id} - Tipo:`, typeof imagePath);
                console.log(`🔍 PostCard - Post ${post.id} - É data URI?`, imagePath?.includes("data:"));
                
                const imageUrl = buildImageUrl(imagePath);
                
                if (!imageUrl) {
                  console.log(`⚠️ PostCard - Post ${post.id} - Sem imagem, usando placeholder`);
                  return "https://via.placeholder.com/200x200?text=Sem+imagem";
                }
                
                console.log(`✅ PostCard - Post ${post.id} - URL final (primeiros 100 chars):`, imageUrl.substring(0, 100));
                console.log(`✅ PostCard - Post ${post.id} - É data URI na URL final?`, imageUrl.includes("data:"));
                return imageUrl;
              })(),
            }}
            style={styles.image}
            onError={(error) => {
              console.error(`❌ PostCard - Erro ao carregar imagem do post ${post.id}:`, error);
              console.error(`❌ PostCard - imageSrc:`, post.imageSrc);
              console.error(`❌ PostCard - image:`, post.image);
              const imageUrl = buildImageUrl(post.imageSrc || post.image);
              console.error(`❌ PostCard - URL tentada:`, imageUrl);
            }}
            resizeMode="cover"
          />
        </View>

        {/* Conteúdo à direita */}
        <View style={styles.textContent}>
          <Text style={styles.title}>{post.title}</Text>

          {/* Footer com interações */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onLike?.(post.id)}
            >
              <FontAwesome
                name={post.isLiked ? "heart" : "heart-o"}
                size={16}
                color={post.isLiked ? APP_CONFIG.PRIMARY_COLOR : "#999"}
              />
              <Text
                style={[styles.actionText, post.isLiked && styles.likedText]}
              >
                {post.likes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onComment?.(post.id)}
            >
              <FontAwesome name="comment-o" size={16} color="#999" />
              <Text style={styles.actionText}>{post.comments}</Text>
            </TouchableOpacity>

            {/* Avatar do autor - clicável */}
            <TouchableOpacity
              style={styles.avatar}
              onPress={handleAuthorPress}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarText}>
                {post.author.name.charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
  },
  imageContainer: {
    width: 120,
    height: 120,
    marginRight: 16,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  textContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: APP_CONFIG.PRIMARY_COLOR,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    color: "#999",
    marginLeft: 4,
  },
  likedText: {
    color: APP_CONFIG.PRIMARY_COLOR,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
});
