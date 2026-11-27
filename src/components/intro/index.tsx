import { BRAND, Button } from '@/components/ui/Button';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageIndicator } from '../ui/PageIndicator';
import { INTRO_DETAILS } from './data';
import { useEventListener } from 'expo';
import { Image as ExpoImage } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';

const IntroHeader = () => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Image
        source={require('@/assets/react-logo.png')}
        style={{ width: 35, height: 35 }}
      />
      <Pressable
        hitSlop={40}
        onPress={() => router.push('/auth/signup')}
      >
        <Text style={styles.skipButton}>Skip</Text>
      </Pressable>
    </View>
  );
};

const IntroIllustration = ({
  video,
  poster,
}: {
  video: number;
  poster: number;
}) => {
  const [isVideoVisible, setIsVideoVisible] = useState(false);

  const player = useVideoPlayer(video, (player) => {
    player.loop = false;
    player.muted = true;
    player.audioMixingMode = 'mixWithOthers';
    player.play();
  });

  // The clips are HEVC, which not every Android device can decode — keep the poster up if playback fails.
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'error') setIsVideoVisible(false);
  });

  return (
    <View style={styles.illustration}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        surfaceType="textureView"
        onFirstFrameRender={() => setIsVideoVisible(true)}
      />
      {!isVideoVisible && (
        <ExpoImage
          source={poster}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
        />
      )}
    </View>
  );
};

const IntroContent = ({
  title,
  description,
  illustration,
  fallBack,
  activeIndex,
}: {
  title: string;
  description: string;
  illustration: number;
  fallBack: number;
  activeIndex: number;
}) => {
  return (
    <View style={styles.content}>
      <IntroIllustration
        key={activeIndex}
        video={illustration}
        poster={fallBack}
      />
      <View>
        <Text style={styles.contentHeader}>{title}</Text>
        <Text style={styles.contentDescription}>{description}</Text>
      </View>
      <PageIndicator
        count={3}
        activeIndex={activeIndex}
      />
    </View>
  );
};

const IntroFooter = ({
  isLast,
  action,
}: {
  isLast: boolean;
  action?: () => void;
}) => {
  const router = useRouter();
  return (
    <View style={styles.footer}>
      <Button
        title={isLast ? 'Get Started' : 'Next'}
        onPress={isLast ? () => router.push('/onboarding') : action}
        fullWidth
      />
      <Text style={{ color: '#68757C', fontSize: 16, fontWeight: '400' }}>
        Already have an account?{' '}
        <Link
          href="/auth/login"
          style={{ color: BRAND, fontSize: 16, fontWeight: '500' }}
        >
          Log in
        </Link>
      </Text>
    </View>
  );
};

const Introduction = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const introInfo = INTRO_DETAILS;

  return (
    <SafeAreaView style={styles.container}>
      <IntroHeader />
      <IntroContent
        title={introInfo[activeIndex].header}
        description={introInfo[activeIndex].description}
        illustration={introInfo[activeIndex].illustration}
        fallBack={introInfo[activeIndex].fallBack}
        activeIndex={activeIndex}
      />
      <IntroFooter
        isLast={activeIndex === introInfo.length - 1}
        action={() => {
          if (activeIndex < introInfo.length - 1) {
            setActiveIndex(activeIndex + 1);
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  illustration: {
    width: '100%',
    aspectRatio: 1326 / 1080,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    color: '#A9B4BA',
    fontSize: 16,
    fontWeight: '500',
  },
  container: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 40,
    gap: 40,
  },
  contentHeader: { color: '#1D2541', fontSize: 30, fontWeight: '600' },
  contentDescription: { color: '#68757C', fontSize: 16, fontWeight: '400' },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
});

export default Introduction;
