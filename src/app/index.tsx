import type { LessonClip, SelectedWord, SubtitleWord } from "@/lib/lessons";
import { fetchLessonClips } from "@/lib/lessons";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItemInfo,
  type ViewToken
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Repeats the clip array to simulate an infinite feed */
const FEED_REPEAT_COUNT = 120;
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 70 } as const;
/** Approximate height of the subtitle bar, used to offset the word panel above it */
const SUBTITLE_LINE_HEIGHT = 118;

// ─── Utilities ────────────────────────────────────────────────────────────────

const createFeedClips = (clips: LessonClip[]) =>
  Array.from({ length: FEED_REPEAT_COUNT }, (_, batchIndex) =>
    clips.map((clip) => ({ ...clip, id: `${clip.id}-${batchIndex}` })),
  ).flat();

const getSubtitleBottomOffset = (height: number) =>
  Math.max(188, Math.min(236, height * 0.25));

// ─── LessonVideo ─────────────────────────────────────────────────────────────

function LessonVideo({
  clip,
  isActive,
}: {
  clip: LessonClip;
  isActive: boolean;
}) {
  const player = useVideoPlayer(clip.source, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    if (isActive) player.play();
    else player.pause();
  }, [isActive, player]);

  const onPress = () => {
    if (player.playing) player.pause();
    else player.play();
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView
        contentFit="cover"
        nativeControls={false}
        player={player}
        style={StyleSheet.absoluteFill}
      />
      <Pressable 
        onPress={onPress}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

// ─── SubtitleLine ─────────────────────────────────────────────────────────────

function SubtitleLine({
  clip,
  onWordPress,
}: {
  clip: LessonClip;
  onWordPress: (word: SubtitleWord, clip: LessonClip) => void;
}) {
  return (
    <View className="w-full max-w-sm self-center rounded-lg border border-white/15 bg-slate-950/75 p-3">
      <Text className="mb-2 text-xs font-extrabold uppercase text-emerald-400">
        Tap a word to reveal its meaning
      </Text>
      <View className="flex-row flex-wrap items-center justify-center gap-1.5">
        {clip.words.map((word, i) => (
          <Pressable
            accessibilityLabel={`${word.text}, ${word.role}. Tap for definition and sentence translation.`}
            accessibilityRole="button"
            hitSlop={8}
            key={`${clip.id}-${i}`}
            onPress={() => onWordPress(word, clip)}
            className="min-h-10 rounded-lg border border-white/20 bg-white/15 px-2 py-1.5 active:scale-95 active:bg-emerald-400/30"
          >
            <Text className="text-lg font-extrabold leading-normal text-white">
              {word.text}
            </Text>
          </Pressable>
        ))}
        <Text className="text-xl font-extrabold text-white">
          {clip.sentence.endsWith(".") ? "." : ""}
        </Text>
      </View>
    </View>
  );
}

// ─── WordInsightPanel ─────────────────────────────────────────────────────────

type WordInsightPanelProps = {
  selected: SelectedWord | null;
  bottom: number;
  onDismiss: () => void;
};

function WordInsightPanel({
  selected,
  bottom,
  onDismiss,
}: WordInsightPanelProps) {
  if (!selected) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 z-40 items-center px-3"
      style={{ bottom, elevation: 32 }}
    >
      <View className="w-full max-w-sm rounded-lg border border-white/45 bg-slate-50/95 p-3">
        <View className="mb-2 flex-row items-center justify-between gap-2.5">
          <Text className="shrink text-2xl font-black text-slate-900">
            {selected.word.text}
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="rounded-lg bg-slate-800 px-2.5 py-1.5">
              <Text className="text-xs font-black uppercase text-emerald-400">
                {selected.word.role}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Hide definition"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onDismiss}
              className="h-8 w-8 items-center justify-center rounded-lg bg-slate-200"
            >
              <Ionicons name="close" size={18} color="#1e293b" />
            </Pressable>
          </View>
        </View>
        <Text className="mb-2 text-base font-bold leading-snug text-gray-900">
          {selected.word.definition}
        </Text>
        <Text className="mb-1 text-sm font-extrabold leading-snug text-slate-600">
          {selected.clip.sentence}
        </Text>
        <Text className="text-base font-black leading-snug text-teal-700">
          {selected.clip.translation}
        </Text>
      </View>
    </View>
  );
}

// ─── SettingsPanel ───────────────────────────────────────────────────────────

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LANGUAGES = ["Spanish", "French", "Portuguese", "Japanese", "German", "Italian", "Mandarin", "Korean"];
const CONTENT_TYPES = ["Conversation", "News", "Comedy", "Education", "Food & Culture", "Travel", "Music", "Sports", "Documentary", "Lifestyle"];
const SPEEDS = ["0.75x", "1.0x", "1.25x", "1.5x"];
const SUBTITLE_SIZES = ["Small", "Medium", "Large"];

type SettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

function toggleItem(item: string, selected: string[], setSelected: (v: string[]) => void) {
  setSelected(selected.includes(item) ? selected.filter((i) => i !== item) : [...selected, item]);
}

function ChipRow({
  items,
  selected,
  onToggle,
  single = false,
}: {
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  single?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => {
        const active = single ? selected[0] === item : selected.includes(item);
        return (
          <Pressable
            key={item}
            onPress={() => onToggle(item)}
            className={`rounded-full px-3 py-1.5 ${active ? "bg-emerald-400" : "bg-slate-100 border border-slate-200"}`}
          >
            <Text className={`text-sm font-bold ${active ? "text-white" : "text-slate-700"}`}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2.5">
      <Text className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</Text>
      {children}
    </View>
  );
}

function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [selectedLevels, setSelectedLevels] = useState<string[]>(["A2"]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["Spanish"]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [speed, setSpeed] = useState("1.0x");
  const [subtitleSize, setSubtitleSize] = useState("Medium");

  return (
    <View
      pointerEvents={isOpen ? "box-none" : "none"}
      className="absolute inset-0 z-50 justify-end"
      style={{ elevation: 50, display: isOpen ? "flex" : "none" }}
    >
      <Pressable
        onPress={onClose}
        className="absolute inset-0 bg-black/60"
        pointerEvents="auto"
      />
      <View className="z-50 rounded-t-2xl bg-white" style={{ maxHeight: "85%" }}>
        <View className="items-center pt-3 pb-1">
          <View className="h-1 w-10 rounded-full bg-slate-300" />
        </View>

        <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
          <Text className="text-xl font-black text-slate-900">Filters & Settings</Text>
          <Pressable
            accessibilityLabel="Close settings"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
          >
            <Ionicons name="close" size={18} color="#475569" />
          </Pressable>
        </View>

        <ScrollView className="px-5" contentContainerStyle={{ gap: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          <Section title="Language">
            <ChipRow
              items={LANGUAGES}
              selected={selectedLanguages}
              onToggle={(item) => toggleItem(item, selectedLanguages, setSelectedLanguages)}
            />
          </Section>

          <Section title="Level">
            <ChipRow
              items={LEVELS}
              selected={selectedLevels}
              onToggle={(item) => toggleItem(item, selectedLevels, setSelectedLevels)}
            />
          </Section>

          <Section title="Content Type">
            <ChipRow
              items={CONTENT_TYPES}
              selected={selectedTypes}
              onToggle={(item) => toggleItem(item, selectedTypes, setSelectedTypes)}
            />
          </Section>

          <Section title="Playback Speed">
            <ChipRow
              items={SPEEDS}
              selected={[speed]}
              onToggle={setSpeed}
              single
            />
          </Section>

          <Section title="Subtitle Size">
            <ChipRow
              items={SUBTITLE_SIZES}
              selected={[subtitleSize]}
              onToggle={setSubtitleSize}
              single
            />
          </Section>

          <Text className="text-xs text-slate-400 text-center">Slingo v0.1.0</Text>

        </ScrollView>
      </View>
    </View>
  );
}

// ─── CommentsPanel ───────────────────────────────────────────────────────────

type Comment = {
  id: string;
  avatar: string;
  username: string;
  text: string;
  time: string;
  likes: number;
  liked: boolean;
  reply?: { username: string; text: string };
};

const MOCK_COMMENTS: Comment[] = [
  { id: "1", avatar: "S", username: "sara_learns", text: "This is exactly how my abuela says it 😭❤️", time: "2h", likes: 312, liked: false },
  { id: "2", avatar: "M", username: "miguel.fluent", text: "The accent on \"están\" always gets me", time: "3h", likes: 87, liked: true, reply: { username: "slingo_app", text: "Keep practicing — you'll nail it! 💪" } },
  { id: "3", avatar: "A", username: "annakowalski", text: "B2 content is so good. Finally something that doesn't treat me like a baby 😂", time: "5h", likes: 204, liked: false },
  { id: "4", avatar: "J", username: "javierlingo", text: "Can we get more food & culture content?? This is my fav topic", time: "6h", likes: 55, liked: false },
  { id: "5", avatar: "K", username: "k_polyglot", text: "I watch this one every morning with my coffee ☕", time: "8h", likes: 430, liked: true },
  { id: "6", avatar: "L", username: "lu_br", text: "Studying for DELE and Slingo is genuinely helping more than my textbook", time: "10h", likes: 178, liked: false },
  { id: "7", avatar: "T", username: "tomasz_es", text: "The word breakdown is 🤌🤌", time: "12h", likes: 93, liked: false },
];

const AVATAR_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899", "#8b5cf6"];

type CommentsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

function CommentRow({ comment }: { comment: Comment }) {
  const [liked, setLiked] = useState(comment.liked);
  const [likes, setLikes] = useState(comment.likes);
  const color = AVATAR_COLORS[comment.id.charCodeAt(0) % AVATAR_COLORS.length];

  const toggleLike = () => {
    setLiked((v) => !v);
    setLikes((v) => (liked ? v - 1 : v + 1));
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>{comment.avatar}</Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>{comment.username}</Text>
            <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{comment.time}</Text>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.88)", fontSize: 14, lineHeight: 20 }}>{comment.text}</Text>
          <Pressable hitSlop={6}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "600", marginTop: 2 }}>Reply</Text>
          </Pressable>
          {comment.reply && (
            <View style={{ marginTop: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: "rgba(255,255,255,0.1)", gap: 2 }}>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700" }}>{comment.reply.username}</Text>
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>{comment.reply.text}</Text>
            </View>
          )}
        </View>
        <Pressable onPress={toggleLike} style={{ alignItems: "center", gap: 2, paddingTop: 2 }}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={18} color={liked ? "#f43f5e" : "rgba(255,255,255,0.4)"} />
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{likes}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CommentsPanel({ isOpen, onClose }: CommentsPanelProps) {
  const [text, setText] = useState("");

  return (
    <View
      pointerEvents={isOpen ? "box-none" : "none"}
      className="absolute inset-0 z-50 justify-end"
      style={{ elevation: 50, display: isOpen ? "flex" : "none" }}
    >
      <Pressable onPress={onClose} className="absolute inset-0 bg-black/60" pointerEvents="auto" />

      <View style={{ backgroundColor: "#161616", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%", overflow: "hidden" }}>
        {/* Handle */}
        <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 6 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.18)" }} />
        </View>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingBottom: 12, position: "relative" }}>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>{MOCK_COMMENTS.length} comments</Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => ({ position: "absolute", right: 16, opacity: pressed ? 0.5 : 1 })}
          >
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />

        {/* Comments list */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
          {MOCK_COMMENTS.map((c) => <CommentRow key={c.id} comment={c} />)}
          <View style={{ height: 12 }} />
        </ScrollView>

        {/* Input bar */}
        <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 28 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#6366f1", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>Y</Text>
          </View>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Add a comment…"
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={{ flex: 1, color: "#fff", fontSize: 14 }}
            />
            {text.length > 0 && (
              <Pressable onPress={() => setText("")} hitSlop={8}>
                <Text style={{ color: "#10b981", fontWeight: "700", fontSize: 14 }}>Post</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const AnimatedView = Animated.View;

// ─── UploadPanel ─────────────────────────────────────────────────────────────

type UploadPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

function UploadPanel({ isOpen, onClose }: UploadPanelProps) {
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("Spanish");
  const [selectedLevel, setSelectedLevel] = useState("A2");
  const [videoSelected, setVideoSelected] = useState(false);

  const slideAnim = useRef(new Animated.Value(1000)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : 1000,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const reset = () => {
    setTopic("");
    setDescription("");
    setSelectedLanguage("Spanish");
    setSelectedLevel("A2");
    setVideoSelected(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canPost = videoSelected && topic.trim().length > 0;

  return (
    <AnimatedView
      pointerEvents={isOpen ? "box-none" : "none"}
      style={[StyleSheet.absoluteFill, { zIndex: 60, transform: [{ translateY: slideAnim }] }]}
    >
      {/* Full-screen dark bg */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0a0a0a" }]} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" }}>
          <Pressable onPress={handleClose} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>New Post</Text>
          <Pressable
            onPress={canPost ? handleClose : undefined}
            style={({ pressed }) => ({
              backgroundColor: canPost ? "#10b981" : "rgba(16,185,129,0.25)",
              paddingHorizontal: 16,
              paddingVertical: 7,
              borderRadius: 20,
              opacity: pressed && canPost ? 0.7 : 1,
            })}
          >
            <Text style={{ color: canPost ? "#fff" : "rgba(255,255,255,0.35)", fontWeight: "700", fontSize: 15 }}>Post</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 20 }}>
          {/* Video picker */}
          <Pressable
            onPress={() => setVideoSelected((v) => !v)}
            style={({ pressed }) => ({
              height: 220,
              borderRadius: 14,
              backgroundColor: videoSelected ? "#111" : "rgba(255,255,255,0.04)",
              borderWidth: 1.5,
              borderColor: videoSelected ? "#10b981" : "rgba(255,255,255,0.1)",
              borderStyle: videoSelected ? "solid" : "dashed",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            {videoSelected ? (
              <>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(16,185,129,0.15)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="checkmark" size={30} color="#10b981" />
                </View>
                <Text style={{ color: "#10b981", fontWeight: "700", fontSize: 15 }}>video_lesson.mp4</Text>
                <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Tap to change</Text>
              </>
            ) : (
              <>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="cloud-upload-outline" size={32} color="rgba(255,255,255,0.5)" />
                </View>
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Select video</Text>
                <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>MP4 · MOV · up to 500 MB</Text>
              </>
            )}
          </Pressable>

          {/* Topic */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700", letterSpacing: 1.1, textTransform: "uppercase" }}>Title</Text>
            <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: topic ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.08)" }}>
              <TextInput
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. Ordering coffee in Madrid"
                placeholderTextColor="rgba(255,255,255,0.25)"
                style={{ color: "#fff", fontSize: 15 }}
                maxLength={80}
              />
            </View>
            <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "right" }}>{topic.length}/80</Text>
          </View>

          {/* Description */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700", letterSpacing: 1.1, textTransform: "uppercase" }}>Description</Text>
            <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: description ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.08)", minHeight: 90 }}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe what learners will practice…"
                placeholderTextColor="rgba(255,255,255,0.25)"
                style={{ color: "#fff", fontSize: 15 }}
                multiline
                maxLength={200}
              />
            </View>
            <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "right" }}>{description.length}/200</Text>
          </View>

          {/* Language */}
          <View style={{ gap: 10 }}>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700", letterSpacing: 1.1, textTransform: "uppercase" }}>Language</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {LANGUAGES.map((lang) => (
                <Pressable
                  key={lang}
                  onPress={() => setSelectedLanguage(lang)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: selectedLanguage === lang ? "#10b981" : "rgba(255,255,255,0.07)",
                    borderWidth: 1,
                    borderColor: selectedLanguage === lang ? "#10b981" : "rgba(255,255,255,0.1)",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: selectedLanguage === lang ? "#fff" : "rgba(255,255,255,0.65)", fontWeight: "600", fontSize: 14 }}>{lang}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Level */}
          <View style={{ gap: 10 }}>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700", letterSpacing: 1.1, textTransform: "uppercase" }}>Level</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {LEVELS.map((lvl) => (
                <Pressable
                  key={lvl}
                  onPress={() => setSelectedLevel(lvl)}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: selectedLevel === lvl ? "#10b981" : "rgba(255,255,255,0.07)",
                    borderWidth: 1,
                    borderColor: selectedLevel === lvl ? "#10b981" : "rgba(255,255,255,0.1)",
                    alignItems: "center",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: selectedLevel === lvl ? "#fff" : "rgba(255,255,255,0.65)", fontWeight: "700", fontSize: 14 }}>{lvl}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ height: 8 }} />
        </ScrollView>
      </SafeAreaView>
    </AnimatedView>
  );
}

// ─── ClipActions ──────────────────────────────────────────────────────────────

type ClipActionButtonProps = {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

function ClipActionButton({
  icon,
  label,
  onPress,
  accessibilityLabel,
}: ClipActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      className="items-center gap-1 active:opacity-70"
    >
      {icon}
      <Text
        className="text-xs font-bold text-white"
        style={{ textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type ClipActionsProps = {
  subtitlesVisible: boolean;
  onToggleSubtitles: () => void;
  onShare: () => void;
  settingsToggle: () => void;
  commentsToggle: () => void;
  liked: boolean;
  onLike: () => void;
};

function ClipActions({
  subtitlesVisible,
  onToggleSubtitles,
  onShare,
  settingsToggle,
  commentsToggle,
  liked,
  onLike,
}: ClipActionsProps) {
  const iconStyle = { textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 };

  return (
    <View
      className="absolute right-3 top-[35%] z-20 items-center gap-6"
      style={{ elevation: 16 }}
    >
      <ClipActionButton
        accessibilityLabel={liked ? "Unlike this clip" : "Like this clip"}
        icon={<Ionicons name={liked ? "heart" : "heart-outline"} size={32} color={liked ? "#34d399" : "white"} style={iconStyle} />}
        label={liked ? "Liked" : "Like"}
        onPress={onLike}
      />
      <ClipActionButton
        accessibilityLabel="Comments"
        icon={<Ionicons name="chatbubble-outline" size={32} color="white" style={iconStyle} />}
        label="Comment"
        onPress={commentsToggle}
      />
      <ClipActionButton
        accessibilityLabel="Save this clip"
        icon={<Ionicons name="bookmark-outline" size={32} color="white" style={iconStyle} />}
        label="Save"
      />
      <ClipActionButton
        accessibilityLabel={subtitlesVisible ? "Hide AI subtitles" : "Show AI subtitles"}
        icon={
          <View className={`items-center justify-center rounded border-2 px-1 py-0.5 ${subtitlesVisible ? "border-emerald-400" : "border-white"}`}>
            <Text className={`text-xs font-black leading-none ${subtitlesVisible ? "text-emerald-400" : "text-white"}`}>CC</Text>
          </View>
        }
        label="Subs"
        onPress={onToggleSubtitles}
      />
      <ClipActionButton
        accessibilityLabel="Share this clip"
        icon={<Ionicons name="paper-plane-outline" size={32} color="white" style={iconStyle} />}
        label="Share"
        onPress={onShare}
      />
      <ClipActionButton
        accessibilityLabel="Open settings"
        icon={<Ionicons name="settings-outline" size={32} color="white" style={iconStyle} />}
        label="Settings"
        onPress={settingsToggle}
      />
    </View>
  );
}

// ─── LessonClipCard ───────────────────────────────────────────────────────────

type LessonClipCardProps = {
  clip: LessonClip;
  height: number;
  isActive: boolean;
  activeInsight: SelectedWord | null;
  onWordPress: (word: SubtitleWord, clip: LessonClip) => void;
  subtitlesVisible: boolean;
  onToggleSubtitles: () => void;
  onDismissWord: () => void;
  settingsToggle: () => void;
  commentsToggle: () => void;
};

function LessonClipCard({
  clip,
  height,
  isActive,
  activeInsight,
  onWordPress,
  subtitlesVisible,
  onToggleSubtitles,
  onDismissWord,
  settingsToggle,
  commentsToggle,
}: LessonClipCardProps) {
  const subtitleBottom = getSubtitleBottomOffset(height);
  const [liked, setLiked] = useState(false);

  const handleShare = async () => {
    await Share.share({
      message: `"${clip.sentence}" — ${clip.translation}\n\nLearn ${clip.language} with Slingo!`,
      title: clip.topic,
    });
  };

  return (
    <View className="w-full overflow-hidden bg-slate-900" style={{ height }}>
      <LessonVideo clip={clip} isActive={isActive} />
      <View pointerEvents="none" className="absolute inset-0 bg-black/20" />

      <SafeAreaView
        pointerEvents="box-none"
        className="flex-1 justify-between px-4"
      >
        <View className="flex-row items-center justify-between pt-2">
          <Text className="text-2xl font-extrabold text-white">Slingo!!</Text>
          <View className="min-w-12 items-center rounded-lg border border-white/25 bg-white/20 px-2.5 py-1.5">
            <Text className="text-sm font-extrabold text-white">
              {clip.level}
            </Text>
          </View>
        </View>

        <ClipActions
          subtitlesVisible={subtitlesVisible}
          onToggleSubtitles={onToggleSubtitles}
          onShare={handleShare}
          settingsToggle={settingsToggle}
          commentsToggle={commentsToggle}
          liked={liked}
          onLike={() => setLiked((v) => !v)}
        />

        {subtitlesVisible && (
          <>
            <WordInsightPanel
              bottom={subtitleBottom + SUBTITLE_LINE_HEIGHT}
              onDismiss={onDismissWord}
              selected={activeInsight}
            />
            <View
              pointerEvents="box-none"
              className="absolute inset-x-0 z-30 items-center justify-center px-3"
              style={{ bottom: subtitleBottom, elevation: 30 }}
            >
              <SubtitleLine clip={clip} onWordPress={onWordPress} />
            </View>
          </>
        )}

        <View
          pointerEvents="none"
          className="z-10 mt-auto pb-8 pr-16"
          style={{ elevation: 2, gap: 10 }}
        >
          {/* Username row */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#10b981", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" }}>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>
                {clip.creator?.[0]?.toUpperCase() ?? "S"}
              </Text>
            </View>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              @{clip.creator?.toLowerCase().replace(/\s+/g, "_") ?? "slingo"}
            </Text>
          </View>

          {/* Topic / caption */}
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16, lineHeight: 22 }}>
            {clip.topic}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 14, lineHeight: 20 }} numberOfLines={2}>
            {clip.caption}
          </Text>

          {/* Tags row */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "700" }}>
              #{clip.topic}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "700" }}>
              #{clip.language.toLowerCase()}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "700" }}>
              #{clip.level}
            </Text>
          </View>

          {/* Audio pill — TikTok style */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="musical-notes" size={13} color="rgba(255,255,255,0.75)" />
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "500" }}>
              {clip.language} · {clip.level}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── AccountPage ─────────────────────────────────────────────────────────────

const PLACEHOLDER_GRID = Array.from({ length: 9 }, (_, i) => ({
  id: String(i),
  label: ["A1", "A2", "B1", "B2", "C1", "B1", "A2", "C2", "B2"][i],
  color: ["#1e293b", "#0f2027", "#1a1a2e", "#0d1b2a", "#16213e", "#1e293b", "#0f2027", "#0d1b2a", "#16213e"][i],
}));

type AccountPageProps = { onClose: () => void };

function AccountPage({ onClose }: AccountPageProps) {
  const [following, setFollowing] = useState(false);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0a0a0a", zIndex: 55 }]}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
          <Pressable onPress={onClose} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, marginRight: 12 })}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700", flex: 1 }}>@slingo_learner</Text>
          <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile header */}
          <View style={{ alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 12 }}>
            <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: "#10b981", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#10b981" }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 34 }}>S</Text>
            </View>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>Slingo Learner</Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center", lineHeight: 20 }}>
              Learning Spanish 🇪🇸 · Level A2{"\n"}1 clip a day keeps the forgetting away
            </Text>

            {/* Stats */}
            <View style={{ flexDirection: "row", gap: 32, marginTop: 4 }}>
              {[["0", "Posts"], ["124", "Followers"], ["38", "Following"]].map(([n, label]) => (
                <View key={label} style={{ alignItems: "center", gap: 2 }}>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>{n}</Text>
                  <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Action buttons */}
            <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
              <Pressable
                onPress={() => setFollowing((v) => !v)}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 9,
                  borderRadius: 8,
                  backgroundColor: following ? "rgba(255,255,255,0.08)" : "#10b981",
                  alignItems: "center",
                  opacity: pressed ? 0.75 : 1,
                  borderWidth: following ? 1 : 0,
                  borderColor: "rgba(255,255,255,0.15)",
                })}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{following ? "Following" : "Follow"}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 9,
                  borderRadius: 8,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  alignItems: "center",
                  opacity: pressed ? 0.75 : 1,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                })}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Message</Text>
              </Pressable>
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)", marginBottom: 2 }} />

          {/* Grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {PLACEHOLDER_GRID.map((item) => (
              <View
                key={item.id}
                style={{
                  width: "33.33%",
                  aspectRatio: 0.6,
                  backgroundColor: item.color,
                  borderWidth: 0.5,
                  borderColor: "#0a0a0a",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  padding: 8,
                }}
              >
                <Ionicons name="play" size={20} color="rgba(255,255,255,0.3)" style={{ position: "absolute", top: "40%", alignSelf: "center" }} />
                <View style={{ backgroundColor: "rgba(16,185,129,0.25)", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: "#10b981", fontSize: 11, fontWeight: "800" }}>{item.label}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── BottomNav ────────────────────────────────────────────────────────────────

type BottomNavTab = "feed" | "account";

type BottomNavProps = {
  activeTab: BottomNavTab;
  onTabPress: (tab: BottomNavTab) => void;
  onUploadPress: () => void;
};

function BottomNav({ activeTab, onTabPress, onUploadPress }: BottomNavProps) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
        paddingBottom: 30,
        paddingTop: 12,
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 70,
      }}
    >
      {/* Videos */}
      <Pressable
        onPress={() => onTabPress("feed")}
        style={({ pressed }) => ({ alignItems: "center", gap: 4, paddingHorizontal: 24, opacity: pressed ? 0.6 : 1 })}
      >
        <Ionicons name={activeTab === "feed" ? "play-circle" : "play-circle-outline"} size={28} color={activeTab === "feed" ? "#fff" : "rgba(255,255,255,0.5)"} />
        <Text style={{ color: activeTab === "feed" ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: "700" }}>Videos</Text>
      </Pressable>

      {/* Upload — centre */}
      <Pressable
        onPress={onUploadPress}
        style={({ pressed }) => ({
          width: 52,
          height: 52,
          borderRadius: 14,
          backgroundColor: "#10b981",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#10b981",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 8,
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>

      {/* Account */}
      <Pressable
        onPress={() => onTabPress("account")}
        style={({ pressed }) => ({ alignItems: "center", gap: 4, paddingHorizontal: 24, opacity: pressed ? 0.6 : 1 })}
      >
        <Ionicons name={activeTab === "account" ? "person-circle" : "person-circle-outline"} size={28} color={activeTab === "account" ? "#fff" : "rgba(255,255,255,0.5)"} />
        <Text style={{ color: activeTab === "account" ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: "700" }}>Account</Text>
      </Pressable>
    </View>
  );
}

// ─── Loading / Error screens ──────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950">
      <StatusBar style="light" />
      <ActivityIndicator color="#34d399" size="large" />
      <Text className="mt-4 text-sm font-bold text-white/60">
        Loading lessons…
      </Text>
    </View>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-6">
      <StatusBar style="light" />
      <Text className="mb-2 text-lg font-black text-white">
        Failed to load lessons
      </Text>
      <Text className="text-center text-sm text-white/60">{message}</Text>
    </View>
  );
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

function Feed({ clips }: { clips: LessonClip[] }) {
  const [height, setHeight] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "account">("feed");

  const feedRef = useRef<FlatList<LessonClip>>(null);

  const feedClips = useMemo(() => createFeedClips(clips), [clips]);
  const [activeClipId, setActiveClipId] = useState<string | null>(
    clips.length > 0 ? `${clips[0].id}-0` : null,
  );
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [subtitlesVisible, setSubtitlesVisible] = useState(true);

  const toggleSettings = () => setSettingsOpen((prev) => !prev);
  const toggleComments = () => setCommentsOpen((prev) => !prev);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      index,
      length: height,
      offset: height * index,
    }),
    [height],
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<LessonClip>[] }) => {
      const visibleClip = viewableItems.find((item) => item.isViewable)?.item;
      if (visibleClip) setActiveClipId(visibleClip.id);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<LessonClip>) => (
      <LessonClipCard
        activeInsight={selectedWord?.clip.id === item.id ? selectedWord : null}
        clip={item}
        height={height}
        isActive={item.id === activeClipId}
        onDismissWord={() => setSelectedWord(null)}
        onToggleSubtitles={() => {
          setSelectedWord(null);
          setSubtitlesVisible((v) => !v);
        }}
        onWordPress={(word, clip) => setSelectedWord({ word, clip })}
        subtitlesVisible={subtitlesVisible}
        settingsToggle={toggleSettings}
        commentsToggle={toggleComments}
      />
    ),
    [activeClipId, height, selectedWord, subtitlesVisible],
  );

  return (
    <View 
    className="flex-1 bg-slate-950"
    onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      <StatusBar style="light" />
      <FlatList
        ref={feedRef}
        alwaysBounceVertical={false}
        bounces={false}
        data={feedClips}
        decelerationRate="fast"
        disableIntervalMomentum
        getItemLayout={getItemLayout}
        initialNumToRender={3}
        keyExtractor={(item) => item.id}
        maxToRenderPerBatch={4}
        onViewableItemsChanged={onViewableItemsChanged}
        overScrollMode="never"
        removeClippedSubviews
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        viewabilityConfig={VIEWABILITY_CONFIG}
        windowSize={4}
      />
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CommentsPanel isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} />
      <UploadPanel isOpen={uploadOpen} onClose={() => { setUploadOpen(false); setActiveTab("feed"); }} />
      {activeTab === "account" && <AccountPage onClose={() => setActiveTab("feed")} />}
      {!uploadOpen && (
        <BottomNav
          activeTab={activeTab}
          onTabPress={(tab) => { setActiveTab(tab); setUploadOpen(false); }}
          onUploadPress={() => { if (!uploadOpen) setUploadOpen(true); }}
        />
      )}
    </View>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [clips, setClips] = useState<LessonClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchLessonClips()
      .then(setClips)
      .catch((err: Error) => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;
  if (fetchError) return <ErrorScreen message={fetchError} />;
  return <Feed clips={clips} />;
}
