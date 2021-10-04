import React, { useEffect, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

export interface ScrollPickerProps {
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
  selectedIndex?: number;
  wrapperStyle?: ViewStyle;
};

const ScrollPicker = (props: ScrollPickerProps): JSX.Element => {
  const [selectedIndex, setSelectedIndex] = useState<number>(
    props.selectedIndex && props.selectedIndex >= 0 ? props.selectedIndex : 0
    );
  const sView = useRef<ScrollView>(null);
  const [isScrollTo, setIsScrollTo] = useState(false);
  const [heightOfElement, setHeightOfElement] = useState(1);

  //Moves to the initially selected element;
  useEffect(() => {
      setTimeout(() => {
        sView?.current?.scrollTo({ y:  heightOfElement * selectedIndex });
      }, 0);
  },[]);
  
  //Coorects the view on drag event;
  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {

    if (isScrollTo) return;

    const positionAfterScroll = e.nativeEvent.contentOffset.y || 0;
      const closestElementToScrollPosition = Math.round(positionAfterScroll / heightOfElement);

      const positionOfClosetElement = closestElementToScrollPosition * heightOfElement;
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
  };

  const highlightStyle: ViewStyle = {
    position: "absolute",
    top: "35%",
    height: "30%",
    width: "100%",
    borderTopColor: props.highlightColor,
    borderBottomColor: props.highlightColor,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  };

  return (
    <View style={props.wrapperStyle}>
      <View style={highlightStyle} onLayout={event=>setHeightOfElement(event.nativeEvent.layout.height)}/>
      <ScrollView
        ref={sView}
        bounces={false}
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        <View 
        style={{
          paddingVertical: "52%"
        }}>
        {props.dataSource.map((value,index) => <View style={{
          paddingVertical: "10%"
          }}>
            {props.renderItem(value,index)}
          </View>)}  
        </View>
      </ScrollView>
    </View>
  );
}


export default ScrollPicker;