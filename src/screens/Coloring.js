import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import BackButton from '../components/BackButton';
import ColoringSketch from '../components/ColoringSketch';
import SavedDrawingNotice from '../components/SavedDrawingNotice';
import {
  COLORING_PALETTE,
  getColoringTemplate,
} from '../games/coloringTemplates';
import useColoringDrawing from '../games/useColoringDrawing';
import { exportColoring } from '../games/exportColoring';
const ICONS = {
  Undo: 'M9 5 L4 10 L9 15 M4 10 H14 Q21 10 21 17 V20',
  Redo: 'M15 5 L20 10 L15 15 M20 10 H10 Q3 10 3 17 V20',
  Eraser:
    'M4 13 L13 4 Q14 3 15 4 L21 10 Q22 11 21 12 L12 21 H8 L4 17 Q2 15 4 13 Z M9 9 L17 17 M12 21 H22',
  Reset: 'M4 10 A9 9 0 1 1 4 17 M4 4 V10 H10',
  Save: 'M4 3 H18 L22 7 V22 H3 V3 Z M8 3 V10 H17 V3 M8 22 V15 H17 V22',
};
function Tool({ name, onPress, disabled, selected }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name === 'Eraser' ? 'Erase one part' : name}
      accessibilityState={{
        disabled,
        selected: Boolean(selected),
      }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tool,
        selected && styles.selectedTool,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Svg width={22} height={22} viewBox="0 0 26 26" pointerEvents="none">
        <Path
          d={ICONS[name]}
          fill="none"
          stroke="#31516B"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={styles.toolLabel}>{name}</Text>
    </Pressable>
  );
}
function ColoringEditor({ template, navigation }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const wide = width > height;
  const CrayonBody = wide ? ScrollView : View;
  const [color, setColor] = useState(COLORING_PALETTE[0]);
  const [eraser, setEraser] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [savingManually, setSavingManually] = useState(false);
  const savePending = useRef(false);
  const sketchRef = useRef(null);
  const [exportError, setExportError] = useState(null);
  const mounted = useRef(true);
  const active = useRef(true);
  const closeSavedNotice = useCallback(() => setSavedNotice(false), []);
  const paint = useRef({
    color: COLORING_PALETTE[0].value,
    eraser: false,
  });
  const { drawing, ready, saveStatus, act, save } =
    useColoringDrawing(template);
  const filled = Object.keys(drawing.fills).length;
  const complete = filled === template.regions.length;
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      return () => {
        active.current = false;
        setSavedNotice(false);
      };
    }, []),
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function saveWithNotice() {
    if (!ready || savePending.current) return;
    savePending.current = true;
    setSavingManually(true);
    setExportError(null);
    try {
      if (!(await save())) throw new Error('Could not save the drawing.');
      await exportColoring(sketchRef.current, template.id);
      if (mounted.current && active.current) setSavedNotice(true);
    } catch (error) {
      if (mounted.current)
        setExportError(
          error.code === 'E_PERMISSION'
            ? 'Allow saving pictures to save your drawing.'
            : 'Could not save the picture. Please try again.',
        );
    } finally {
      savePending.current = false;
      if (mounted.current) setSavingManually(false);
    }
  }
  const fillPart = useCallback(
    id => {
      if (savePending.current) return;
      // The page and decorative lines have no handler: only named parts can fill.
      if (template.regions.some(region => region.id === id)) {
        act({
          type: 'fill',
          id,
          color: paint.current.eraser ? undefined : paint.current.color,
        });
      }
    },
    [act, template],
  );
  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <Image
        source={require('../assets/homebgimg.jpg')}
        style={styles.background}
        resizeMode="cover"
        pointerEvents="none"
      />
      <View
        style={styles.editorContent}
        pointerEvents={savedNotice || savingManually ? 'none' : 'auto'}
        accessibilityElementsHidden={savedNotice}
        importantForAccessibility={savedNotice ? 'no-hide-descendants' : 'auto'}
      >
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
              paddingLeft: insets.left + 10,
              paddingRight: insets.right + 14,
            },
          ]}
        >
          <BackButton navigation={navigation} size={34} />
          <View style={styles.heading}>
            <Text style={styles.title}>Colour & Play</Text>
            <Text style={styles.subtitle}>
              Pick a colour. Tap a part. Make it yours!
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>✦</Text>
          </View>
        </View>

        <View
          style={[
            styles.workspace,
            wide && styles.wideWorkspace,
            {
              paddingLeft: insets.left + 14,
              paddingRight: insets.right + 14,
            },
          ]}
        >
          <View style={styles.paper}>
            <View style={styles.paperHeading}>
              <Text style={styles.pictureName}>{template.name}</Text>
              <View
                style={[styles.progressBadge, complete && styles.completeBadge]}
              >
                <Text style={styles.progressText}>
                  {filled} / {template.regions.length} parts
                </Text>
              </View>
            </View>
            <View style={styles.canvas} testID="colouring-canvas">
              <ColoringSketch
                svgRef={sketchRef}
                paper
                template={template}
                fills={drawing.fills}
                onFill={fillPart}
                disabled={!ready || savingManually}
              />
            </View>
            <Text style={styles.canvasHint} accessibilityLiveRegion="polite">
              {!ready
                ? 'Opening your picture…'
                : complete
                ? 'Wonderful! Every part is colourful! ★'
                : eraser
                ? 'Tap a part to make it white again'
                : `Your ${color.name.toLowerCase()} adventure starts with a tap!`}
            </Text>
          </View>

          <View
            style={[
              styles.crayonBox,
              wide && styles.wideCrayonBox,
              wide && { width: Math.min(280, width * 0.36) },
            ]}
          >
            <CrayonBody style={wide ? styles.paletteScroll : undefined}>
              <View style={styles.paletteHeading}>
                <Text style={styles.paletteTitle}>Pick a crayon</Text>
                <Text style={styles.colorName}>
                  {eraser ? 'Eraser' : color.name}
                </Text>
              </View>
              <View style={styles.palette}>
                {COLORING_PALETTE.map(item => {
                  const selected = color.value === item.value && !eraser;
                  return (
                    <Pressable
                      key={item.name}
                      accessibilityRole="button"
                      accessibilityLabel={`Choose ${item.name.toLowerCase()}`}
                      accessibilityState={{
                        selected,
                      }}
                      onPress={() => {
                        paint.current = {
                          color: item.value,
                          eraser: false,
                        };
                        setColor(item);
                        setEraser(false);
                      }}
                      style={({ pressed }) => [
                        styles.swatch,
                        selected && styles.selectedSwatch,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View
                        pointerEvents="none"
                        style={[
                          styles.crayon,
                          {
                            backgroundColor: item.value,
                          },
                        ]}
                      >
                        <View style={styles.crayonBand} />
                        {selected && <Text style={styles.check}>✓</Text>}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </CrayonBody>
          </View>
        </View>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + 6,
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.tools,
              {
                paddingLeft: insets.left + 14,
                paddingRight: insets.right + 14,
              },
            ]}
          >
            <Tool
              name="Undo"
              onPress={() =>
                act({
                  type: 'undo',
                })
              }
              disabled={!ready || !drawing.past.length}
            />
            <Tool
              name="Redo"
              onPress={() =>
                act({
                  type: 'redo',
                })
              }
              disabled={!ready || !drawing.future.length}
            />
            <Tool
              name="Eraser"
              onPress={() => {
                paint.current.eraser = !paint.current.eraser;
                setEraser(paint.current.eraser);
              }}
              selected={eraser}
              disabled={!ready}
            />
            <Tool
              name="Reset"
              onPress={() =>
                act({
                  type: 'clear',
                })
              }
              disabled={!ready || !filled}
            />
            <Tool
              name="Save"
              onPress={saveWithNotice}
              disabled={!ready || savingManually}
            />
          </ScrollView>
          <Text style={styles.saveStatus} accessibilityLiveRegion="polite">
            {exportError ||
              (savingManually ? 'Saving your picture…' : saveStatus)}
          </Text>
        </View>
      </View>
      {savedNotice && <SavedDrawingNotice onClose={closeSavedNotice} />}
    </View>
  );
}
export default function Coloring({ route, navigation }) {
  const template = getColoringTemplate(route?.params?.templateId);
  return (
    <ColoringEditor
      key={template.id}
      template={template}
      navigation={navigation}
    />
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF5E4',
  },
  editorContent: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    opacity: 0.32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    backgroundColor: '#FFFAF1',
  },
  heading: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 23,
    color: '#284B67',
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 11,
    color: '#617C8F',
    marginTop: 2,
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#FFE6A1',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [
      {
        rotate: '8deg',
      },
    ],
  },
  headerBadgeText: {
    fontSize: 29,
    color: '#EEA92A',
  },
  workspace: {
    flex: 1,
    paddingVertical: 10,
    gap: 10,
  },
  wideWorkspace: {
    flexDirection: 'row',
  },
  paper: {
    flex: 1,
    minHeight: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 4,
    borderColor: '#BFEADF',
    padding: 10,
  },
  paperHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pictureName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 17,
    color: '#31516B',
  },
  progressBadge: {
    backgroundColor: '#EDF7F4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  completeBadge: {
    backgroundColor: '#FFE8A8',
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#387A6D',
  },
  canvas: {
    flex: 1,
    minHeight: 0,
  },
  canvasHint: {
    fontSize: 11,
    textAlign: 'center',
    color: '#68818C',
    paddingTop: 4,
  },
  crayonBox: {
    backgroundColor: '#FFFAF1',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 22,
    padding: 10,
  },
  wideCrayonBox: {
    maxHeight: '100%',
    flexShrink: 1,
  },
  paletteScroll: { flexShrink: 1 },
  paletteHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  paletteTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#31516B',
  },
  colorName: {
    color: '#68818C',
    fontSize: 11,
  },
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  swatch: {
    width: 46,
    height: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSwatch: {
    backgroundColor: '#FFFFFF',
    borderColor: '#31516B',
  },
  crayon: {
    width: 28,
    height: 36,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crayonBand: {
    position: 'absolute',
    height: 12,
    left: 0,
    right: 0,
    bottom: 6,
    backgroundColor: '#FFFFFF55',
  },
  check: {
    fontWeight: '900',
    fontSize: 21,
    color: '#20394B',
    backgroundColor: '#FFFFFFBB',
    borderRadius: 8,
    lineHeight: 24,
    width: 24,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#FFFAF1',
    paddingTop: 4,
  },
  tools: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  tool: {
    minWidth: 58,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF3F7',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 16,
    paddingHorizontal: 8,
    gap: 3,
  },
  selectedTool: {
    backgroundColor: '#FFE6B9',
    borderColor: '#E8AC4E',
  },
  toolLabel: {
    color: '#31516B',
    fontSize: 10,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.7,
  },
  saveStatus: {
    fontSize: 10,
    color: '#68818C',
    textAlign: 'center',
    paddingTop: 2,
  },
});
