import React, { useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import AppIcon from './AppIcon';
import {
  setMusicOn,
  setTracingSoundsOn,
  useAudioSettings,
} from '../services/audio';
import {
  buyRemoveAds,
  clearPurchaseMessage,
  restoreRemoveAds,
  usePurchases,
} from '../services/purchases';
import { ADS_ON } from '../services/adsConfig';
import {
  clearReminderMessage,
  remindersAvailable,
  setRemindersOn,
  useReminderSettings,
} from '../services/reminders';

// Round gear button (on Home's header) that opens the Settings card:
// - Sounds: music and tracing sounds, each on or off (saved).
// - Reminders: a gentle notification about an unfinished game (off until a
//   parent turns it on; asks for notification permission then).
// - Ads: "Remove Ads Forever" (one-time purchase) and "Restore purchase",
//   both behind a quick grown-up check so a child can't buy by accident.
//   Only shown while the app has ads (see adsConfig.js).
export default function SettingsButton({ size = 46 }) {
  const [open, setOpen] = useState(false);
  function close() {
    setOpen(false);
    clearPurchaseMessage();
    clearReminderMessage();
  }
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Settings"
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <GearIcon size={size} />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable
          accessibilityLabel="Close settings"
          style={styles.backdrop}
          onPress={close}
        >
          {/* Taps on the card itself don't close it. */}
          <Pressable style={styles.card} onPress={() => {}}>
            <ScrollView contentContainerStyle={styles.cardContent}>
              <Text accessibilityRole="header" style={styles.title}>
                Settings
              </Text>
              <AboutBadge />
              <SoundSection />
              {remindersAvailable() ? <ReminderSection /> : null}
              {ADS_ON ? <AdsSection /> : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Done"
                onPress={close}
                style={({ pressed }) => [
                  styles.done,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ------------------------------------------------------------------ sounds
function SoundSection() {
  const settings = useAudioSettings();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Sounds</Text>
      <SettingRow label="Music" on={settings.music} onChange={setMusicOn} />
      <SettingRow
        label="Tracing sounds"
        on={settings.tracingSounds}
        onChange={setTracingSoundsOn}
      />
    </View>
  );
}

// -------------------------------------------------------------------- about
// Shown right under the title so everyone sees who made the app.
function AboutBadge() {
  return (
    <View
      accessible
      accessibilityLabel="ABC Kids, developed by Pixerve"
      style={styles.about}
    >
      <View style={styles.aboutLogo}>
        <Image
          source={require('../assets/abc.png')}
          resizeMode="contain"
          style={styles.aboutLogoImage}
        />
      </View>
      <View style={styles.aboutText}>
        <Text style={styles.aboutApp}>
          <Text style={styles.aboutAbc}>ABC</Text> Kids
        </Text>
        <Text style={styles.creditSmall}>
          Developed by <Text style={styles.creditName}>Pixerve</Text>
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- reminders
function ReminderSection() {
  const { enabled, busy, message, blocked } = useReminderSettings();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reminders</Text>
      <SettingRow
        label="Play reminders"
        on={enabled}
        onChange={setRemindersOn}
        disabled={busy}
        icon={<BellIcon size={40} on={enabled} />}
      />
      <Text style={styles.hint}>
        One gentle reminder if a game is left unfinished for a day.
      </Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {blocked ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open phone settings"
          onPress={() => Linking.openSettings().catch(() => {})}
          hitSlop={8}
        >
          <Text style={styles.restore}>Open phone settings</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SettingRow({ label, on, onChange, disabled, icon }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: on, disabled: Boolean(disabled) }}
      disabled={Boolean(disabled)}
      onPress={() => onChange(!on)}
      style={[styles.row, disabled && styles.disabled]}
    >
      {icon ?? <AppIcon name={on ? 'sound' : 'mute'} size={40} />}
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={on}
        onValueChange={onChange}
        disabled={Boolean(disabled)}
        trackColor={{ false: '#C9D3DD', true: '#7BD3A8' }}
        thumbColor={on ? '#2FB36E' : '#F4F6F8'}
        accessible={false}
        importantForAccessibility="no"
      />
    </Pressable>
  );
}

// --------------------------------------------------------------------- ads
function AdsSection() {
  const { adFree, price, status, message } = usePurchases();
  // Which action is waiting for the grown-up check: 'buy' | 'restore' | null
  const [gate, setGate] = useState(null);
  const busy = status === 'busy';

  if (adFree) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ads</Text>
        <View style={[styles.row, styles.owned]}>
          <Text style={styles.ownedText}>✓ Ad-free forever</Text>
        </View>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    );
  }
  if (gate) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ask a grown-up</Text>
        <GrownUpCheck
          onPass={() => {
            const action = gate;
            setGate(null);
            if (action === 'buy') buyRemoveAds();
            else restoreRemoveAds();
          }}
          onCancel={() => setGate(null)}
        />
      </View>
    );
  }
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Ads</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Remove Ads Forever"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={() => setGate('buy')}
        style={({ pressed }) => [
          styles.buy,
          busy && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.buyText}>Remove Ads Forever</Text>
        <Text style={styles.buyDetail}>
          {price ? `${price} · ` : ''}One-time purchase, no subscription
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Restore purchase"
        disabled={busy}
        onPress={() => setGate('restore')}
        hitSlop={8}
      >
        <Text style={styles.restore}>Restore purchase</Text>
      </Pressable>
      {busy ? <Text style={styles.message}>Please wait…</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

// A simple sum a grown-up answers before buying or restoring.
function GrownUpCheck({ onPass, onCancel }) {
  const [a, b] = useMemo(
    () => [
      6 + Math.floor(Math.random() * 4),
      7 + Math.floor(Math.random() * 3),
    ],
    [],
  );
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  function check() {
    if (Number(answer) === a * b) onPass();
    else {
      setWrong(true);
      setAnswer('');
    }
  }
  return (
    <View style={styles.gate}>
      <Text style={styles.gateQuestion}>
        What is {a} × {b}?
      </Text>
      <TextInput
        accessibilityLabel="Answer"
        value={answer}
        onChangeText={text => {
          setAnswer(text.replace(/[^0-9]/g, ''));
          setWrong(false);
        }}
        onSubmitEditing={check}
        keyboardType="number-pad"
        maxLength={3}
        style={styles.gateInput}
      />
      {wrong ? <Text style={styles.message}>Not quite, try again.</Text> : null}
      <View style={styles.gateActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={onCancel}
          hitSlop={8}
        >
          <Text style={styles.restore}>Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue"
          onPress={check}
          style={({ pressed }) => [styles.gateGo, pressed && styles.pressed]}
        >
          <Text style={styles.doneText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ icons
// A round bell, like the other round icons (faded when reminders are off).
function BellIcon({ size, on }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      opacity={on ? 1 : 0.6}
    >
      <Circle
        cx={50}
        cy={50}
        r={45}
        fill="#FFC94A"
        stroke="#B9791A"
        strokeWidth={5}
      />
      <Circle cx={68} cy={24} r={6} fill="#FFFFFF" opacity={0.55} />
      <Path
        d="M50 24 C36 24 32 36 32 46 L32 58 L25 66 L75 66 L68 58 L68 46 C68 36 64 24 50 24 Z"
        fill="#FFFFFF"
        stroke="#B9791A"
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <Circle
        cx={50}
        cy={72}
        r={6}
        fill="#FFFFFF"
        stroke="#B9791A"
        strokeWidth={3.5}
      />
    </Svg>
  );
}

// A round gear button in the same style as the app's other round icons.
function GearIcon({ size }) {
  const path = useMemo(() => {
    const teeth = 8;
    const outer = 25;
    const inner = 19;
    const points = [];
    for (let i = 0; i < teeth * 4; i++) {
      const angle = (Math.PI * 2 * i) / (teeth * 4) - Math.PI / 2;
      const r = i % 4 < 2 ? outer : inner;
      points.push(
        `${(50 + Math.cos(angle) * r).toFixed(2)} ${(
          50 +
          Math.sin(angle) * r
        ).toFixed(2)}`,
      );
    }
    return `M${points.join(' L')} Z`;
  }, []);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle
        cx={50}
        cy={50}
        r={45}
        fill="#A893E6"
        stroke="#5B47A8"
        strokeWidth={5}
      />
      <Circle cx={68} cy={24} r={6} fill="#FFFFFF" opacity={0.55} />
      <Path
        d={path}
        fill="#FFFFFF"
        stroke="#5B47A8"
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <Circle
        cx={50}
        cy={50}
        r={8}
        fill="#A893E6"
        stroke="#5B47A8"
        strokeWidth={3.5}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75, transform: [{ scale: 0.95 }] },
  disabled: { opacity: 0.5 },
  backdrop: {
    flex: 1,
    backgroundColor: '#233D58AA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    borderRadius: 26,
    backgroundColor: '#FFF7FB',
    borderWidth: 3,
    borderColor: '#FFD1E4',
  },
  cardContent: { paddingHorizontal: 18, paddingVertical: 16, gap: 12 },
  title: {
    textAlign: 'center',
    color: '#22486b',
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    includeFontPadding: false,
  },
  section: { gap: 8 },
  sectionTitle: {
    color: '#4d6881',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  rowLabel: {
    flex: 1,
    color: '#31516B',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  owned: { justifyContent: 'center', paddingVertical: 12 },
  ownedText: { color: '#1E7A4C', fontFamily: 'Poppins-Bold', fontSize: 16 },
  buy: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFB739',
  },
  buyText: { color: '#5A3A00', fontFamily: 'Poppins-Bold', fontSize: 17 },
  buyDetail: {
    color: '#6E4E12',
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    textAlign: 'center',
  },
  restore: {
    textAlign: 'center',
    color: '#3D6E9C',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  hint: {
    color: '#6B8396',
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    marginHorizontal: 6,
  },
  message: {
    textAlign: 'center',
    color: '#54768A',
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
  },
  gate: {
    gap: 8,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  gateQuestion: { color: '#22486b', fontFamily: 'Poppins-Bold', fontSize: 18 },
  gateInput: {
    width: 100,
    borderWidth: 2,
    borderColor: '#C9D3DD',
    borderRadius: 14,
    paddingVertical: 6,
    textAlign: 'center',
    fontSize: 20,
    color: '#22486b',
  },
  gateActions: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  gateGo: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#2FB36E',
  },
  done: {
    alignSelf: 'center',
    paddingHorizontal: 34,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#2FB36E',
  },
  doneText: { color: '#FFFFFF', fontFamily: 'Poppins-Bold', fontSize: 16 },
  // The "ABC Kids, developed by Pixerve" badge under the title.
  about: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1EDFF',
    borderWidth: 1.5,
    borderColor: '#DCD3FF',
  },
  aboutLogo: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutLogoImage: { width: 42, height: 42 },
  aboutText: { flex: 1 },
  aboutApp: {
    color: '#1F2A5C',
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    includeFontPadding: false,
  },
  aboutAbc: { color: '#FF5C7A' },
  creditSmall: {
    color: '#5B6690',
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    marginTop: 2,
  },
  creditName: {
    color: '#7A3FD0',
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
  },
});
