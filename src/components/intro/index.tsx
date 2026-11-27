import { Button } from '@/components/ui/Button';
import { PageIndicator } from '@/components/ui/PageIndicator';
import { Text } from '@/components/ui/Text';
import { Wordmark } from '@/components/ui/Wordmark';
import { colors, radius, sizes } from '@/theme';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { INTRO_DETAILS } from './data';

type IntroItem = (typeof INTRO_DETAILS)[number];

const IntroHeader = () => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Wordmark />
      <Pressable
        hitSlop={16}
        onPress={() => router.push('/auth/signup')}
        accessibilityRole="button"
      >
        <Text
          variant="label"
          color="textFaint"
          style={styles.skip}
        >
          Skip
        </Text>
      </Pressable>
    </View>
  );
};

const IntroIllustration = ({
  video,
  poster,
  isActive,
}: {
  video: number;
  poster: number;
  isActive: boolean;
}) => {
  const player = useVideoPlayer(video, (player) => {
    player.loop = false;
    player.muted = false;
    player.audioMixingMode = 'mixWithOthers';
  });

  // Every slide is mounted at once, so only the visible one may play.
  useEffect(() => {
    if (isActive) {
      player.currentTime = 0;
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <View style={styles.illustration}>
      {/*
        The poster sits permanently underneath rather than being swapped out
        on first frame. Some Android devices decode the video (audio plays)
        but never present its pixels, and onFirstFrameRender still fires —
        which would hide the poster and leave an empty box. Layering means
        the artwork is visible no matter what the video surface does.
      */}
      <ExpoImage
        source={poster}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
      />
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        surfaceType="textureView"
        // iOS 16+ overlays a Live Text "scan" button on paused frames; off for decorative clips.
        allowsVideoFrameAnalysis={false}
      />
    </View>
  );
};

const IntroSlide = ({
  item,
  width,
  isActive,
}: {
  item: IntroItem;
  width: number;
  isActive: boolean;
}) => (
  <View style={[styles.slide, { width }]}>
    <IntroIllustration
      video={item.illustration}
      poster={item.fallBack}
      isActive={isActive}
    />
    <View style={styles.copy}>
      <Text variant="onboardingH1">{item.header}</Text>
      <Text
        variant="bodyLarge"
        color="textMuted"
      >
        {item.description}
      </Text>
    </View>
  </View>
);

const IntroFooter = ({
  isLast,
  onNext,
}: {
  isLast: boolean;
  onNext: () => void;
}) => {
  const router = useRouter();

  return (
    <View style={styles.footer}>
      <Button
        title={isLast ? 'Get started' : 'Next'}
        onPress={isLast ? () => router.push('/auth/signup') : onNext}
        fullWidth
      />
      {/*
        The tappable area has to be the Pressable, not the inline link: a bare
        text link is only as big as its glyphs (~50x20pt), under the 44pt
        minimum. A Pressable cannot be nested inside Text on Android, so it
        wraps the whole sentence instead.
      */}
      <Pressable
        onPress={() => router.push('/auth/login')}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Log in"
      >
        <Text
          variant="bodySm"
          color="textMuted"
        >
          Already have an account?{' '}
          <Text
            variant="bodySm"
            color="primary"
            style={styles.link}
          >
            Log in
          </Text>
        </Text>
      </Pressable>
    </View>
  );
};

const Introduction = () => {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<IntroItem>>(null);

  const isLast = activeIndex === INTRO_DETAILS.length - 1;

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    // Turn the horizontal offset back into a page number.
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(page);
  };

  const goToNext = () => {
    if (isLast) return;
    listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    setActiveIndex(activeIndex + 1);
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom']}
    >
      <IntroHeader />

      <FlatList
        ref={listRef}
        data={INTRO_DETAILS}
        keyExtractor={(item) => item.header}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        // Without this, scrollToIndex has to measure every row first and
        // throws if it hasn't rendered yet. Pages are all one screen wide,
        // so the maths is exact.
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <IntroSlide
            item={item}
            width={width}
            isActive={index === activeIndex}
          />
        )}
        style={styles.pager}
      />

      <View style={styles.dots}>
        <PageIndicator
          count={INTRO_DETAILS.length}
          activeIndex={activeIndex}
        />
      </View>

      <IntroFooter
        isLast={isLast}
        onNext={goToNext}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  // The pager itself is full-bleed so each page is exactly one screen wide;
  // the horizontal padding lives on the header, slides, dots and footer.
  header: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sizes.screenPaddingAuth,
    paddingVertical: 12,
  },
  skip: { fontSize: 14 },
  pager: { flex: 1 },
  slide: {
    justifyContent: 'center',
    paddingHorizontal: sizes.screenPaddingAuth,
    gap: 24,
  },
  illustration: {
    width: '100%',
    height: 288,
    borderRadius: radius.art,
    // Without this the video's square corners punch through the rounded box.
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  copy: { gap: 10 },
  dots: {
    paddingHorizontal: sizes.screenPaddingAuth,
    paddingBottom: 18,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: sizes.screenPaddingAuth,
    paddingBottom: 12,
  },
  link: { fontFamily: 'Poppins_500Medium' },
});

export default Introduction;
