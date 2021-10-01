import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

export type ScrollPickerProps = {
  style?: ViewStyle;
  dataSource: Array<string | number>;
  selectedIndex?: number;
  onValueChange?: (
    value: ScrollPickerProps["dataSource"][0],
    index: number
  ) => void;
  renderItem?: (
    data: ScrollPickerProps["dataSource"][0],
    index: number,
    isSelected: boolean
  ) => JSX.Element;
  highlightColor?: string;

  wrapperStyle?: ViewStyle;
  itemStyle?: ViewStyle
};

export default function ScrollPicker({
  itemStyle = {height: 30},
  style,
  ...props
}: ScrollPickerProps): JSX.Element {
  const [initialized, setInitialized] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(
    props.selectedIndex && props.selectedIndex >= 0 ? props.selectedIndex : 0
  );
  const sView = useRef<ScrollView>(null);
  const [isScrollTo, setIsScrollTo] = useState(false);
  const [dragStarted, setDragStarted] = useState(false);
  const [momentumStarted, setMomentumStarted] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(
    function initialize() {
      if (initialized) return;
      setInitialized(true);

      setTimeout(() => {
        const y = Number(itemStyle.height) * selectedIndex;
        sView?.current?.scrollTo({ y: y });
      }, 0);

      return () => {
        timer && clearTimeout(timer);
      };
    },
    [initialized, itemStyle, selectedIndex, sView, timer]
  );

  const renderPlaceHolder = () => {
    const h = (Number(props.wrapperStyle?.height) - Number(itemStyle.height)) / 2;
    const header = <View style={{ height: h, flex: 1 }} />;
    const footer = <View style={{ height: h, flex: 1 }} />;
    return { header, footer };
  };

  const renderItem = (
    data: ScrollPickerProps["dataSource"][0],
    index: number
  ) => {
    const isSelected = index === selectedIndex;
    const item = props.renderItem ? (
      props.renderItem(data, index, isSelected)
    ) : (
      <Text>
        {data}
      </Text>
    );

    return (
      <View style={[ { height: Number(itemStyle.height) }]} key={index}>
        {item}
      </View>
    );
  };
  const scrollFix = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      let y = 0;
      const h = Number(itemStyle.height);
      if (e.nativeEvent.contentOffset) {
        y = e.nativeEvent.contentOffset.y;
      }
      const _selectedIndex = Math.round(y / h);

      const _y = _selectedIndex * h;
      if (_y !== y) {
        // using scrollTo in ios, onMomentumScrollEnd will be invoked
        if (Platform.OS === "ios") {
          setIsScrollTo(true);
        }
        sView?.current?.scrollTo({ y: _y });
      }
      if (selectedIndex === _selectedIndex) {
        return;
      }
      // onValueChange
      if (props.onValueChange) {
        const selectedValue = props.dataSource[_selectedIndex];
        setSelectedIndex(_selectedIndex);
        props.onValueChange(selectedValue, _selectedIndex);
      }
    },
    [Number(itemStyle.height), props, selectedIndex]
  );

  const onScrollBeginDrag = () => {
    setDragStarted(true);

    if (Platform.OS === "ios") {
      setIsScrollTo(false);
    }
    timer && clearTimeout(timer);
  };

  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setDragStarted(false);

    // if not used, event will be garbaged
    const _e: NativeSyntheticEvent<NativeScrollEvent> = { ...e };
    timer && clearTimeout(timer);
    setTimer(
      setTimeout(() => {
        if (!momentumStarted) {
          scrollFix(_e);
        }
      }, 50)
    );
  };
  const onMomentumScrollBegin = () => {
    setMomentumStarted(true);
    timer && clearTimeout(timer);
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setMomentumStarted(false);

    if (!isScrollTo && !dragStarted) {
      scrollFix(e);
    }
  };

  const { header, footer } = renderPlaceHolder();

  const highlightStyle: ViewStyle = {
    position: "absolute",
    top: (Number(props.wrapperStyle?.height) - Number(itemStyle.height)) / 2,
    height: itemStyle.height,
    width: "100%",
    borderTopColor: props.highlightColor,
    borderBottomColor: props.highlightColor,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  };

  return (
    <View style={props.wrapperStyle}>
      <View style={highlightStyle} />
      <ScrollView
        ref={sView}
        bounces={false}
        showsVerticalScrollIndicator={false}
        onMomentumScrollBegin={(_e) => onMomentumScrollBegin()}
        onMomentumScrollEnd={(e) => onMomentumScrollEnd(e)}
        onScrollBeginDrag={(_e) => onScrollBeginDrag()}
        onScrollEndDrag={(e) => onScrollEndDrag(e)}
      >
        {header}
        {props.dataSource.map(renderItem)}
        {footer}
      </ScrollView>
    </View>
  );
}
