import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

//TODO: Make it work with % and vh
interface CustomViewStyle extends ViewStyle{
  height: number
}

export type ScrollPickerProps = {
  dataSource: Array<string | number>;
  renderItem: (
    data: string | number,
    index: number
  ) => JSX.Element;
  onValueChange?: (
    value: string | number,
    index: number
  ) => void;
  highlightColor?: string;
  highlightHeight: 30;
  selectedIndex: 0;

  wrapperStyle?: CustomViewStyle;
};

const ScrollPicker = (props: ScrollPickerProps): JSX.Element => {
  const [selectedIndex, setSelectedIndex] = useState<number>(
    props.selectedIndex >= 0 ? props.selectedIndex : 0
    );
  const sView = useRef<ScrollView>(null);
  const [isScrollTo, setIsScrollTo] = useState(false);
  const [dragStarted, setDragStarted] = useState(false);
  const [momentumStarted, setMomentumStarted] = useState(false);

  useEffect(() => {
      setTimeout(() => {
        sView?.current?.scrollTo({ y:  props.highlightHeight || 0 * selectedIndex });
      }, 0);
    },[]);

  const renderPlaceHolder = () => {
    const h = ((props.wrapperStyle?.height || 0) - props.highlightHeight) / 2;
    const header = <View style={{ height: h, flex: 1 }} />;
    const footer = <View style={{ height: h, flex: 1 }} />;
    return { header, footer };
  };
  const scrollFix = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      
      const positionAfterScroll = e.nativeEvent.contentOffset.y || 0;
      const closestElementToScrollPosition = Math.round(positionAfterScroll / props.highlightHeight);

      const positionOfClosetElement = closestElementToScrollPosition * props.highlightHeight;
      if (positionOfClosetElement !== positionAfterScroll) {
        // using scrollTo in ios, onMomentumScrollEnd will be invoked
        if (Platform.OS === "ios") {
          setIsScrollTo(true);
        }
        sView?.current?.scrollTo({ y: positionOfClosetElement });
      }
      // onValueChange
      if (selectedIndex !== closestElementToScrollPosition && props.onValueChange) {
        setSelectedIndex(closestElementToScrollPosition);
        props.onValueChange(
          props.dataSource[closestElementToScrollPosition], 
          closestElementToScrollPosition
        );
      }
    },
    [props, selectedIndex]
  );

  const onScrollBeginDrag = () => {
    setDragStarted(true);

    if (Platform.OS === "ios") {
      setIsScrollTo(false);
    }
  };

  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setDragStarted(false);

    // if not used, event will be garbaged
    const _e: NativeSyntheticEvent<NativeScrollEvent> = { ...e };
      setTimeout(() => {
        if (!momentumStarted) {
          scrollFix(_e);
        }
      }, 50)
  };
  
  const onMomentumScrollBegin = () => {
    setMomentumStarted(true);
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
    top: ((props.wrapperStyle?.height || 0) - props.highlightHeight) / 2,
    height: props.highlightHeight,
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
        {props.dataSource.map(props.renderItem)}
        {footer}
      </ScrollView>
    </View>
  );
}


export default ScrollPicker;