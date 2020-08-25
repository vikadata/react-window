import React, { createElement } from 'react';
import { styles } from './scrollbar.style';

export interface IScrollBarProps {
  offset: number;
  height: number;
  totalLength: number;
  clientHeight: number;
  direction: 'row' | 'column';
  onColumnScrollChange: (dist: number) => void;
}

export class ScrollBar extends React.Component<IScrollBarProps> {
  state = {
    isDown: false,
    // 鼠标到滑块顶部的距离
    downPostion: 0,
  };
  slide: React.RefObject<HTMLDivElement> = React.createRef();
  scrollbarBox: React.RefObject<HTMLDivElement> = React.createRef();

  componentDidMount() {
    window.addEventListener('mousemove', (e: MouseEvent) => {
      const { isDown, downPostion } = this.state;
      const { height, totalLength, clientHeight, direction } = this.props;
      if (!(this.slide.current && this.scrollbarBox.current)) {
        return;
      }
      const left: number = 0;
      const top: number = 0;
      // if (!(this.slide.current && this.slide.current.style.left && this.scrollbarBox.current)) {
      //   return;
      // }

      if (isDown) {
        // 滑块到滚动条顶部的距离
        let slideTopToWrapper: number = 0;
        // 滚动条到视口顶部的距离
        let WrapperTopToClient: number = 0;
        // 调整滑块与鼠标的位置距离
        let dist: number = 0;
        let slideHeight: number = 0;
        if (direction === 'row') {
          slideTopToWrapper = left;
          WrapperTopToClient = this.scrollbarBox.current.getBoundingClientRect().left;
          dist = e.clientX - WrapperTopToClient - slideTopToWrapper - downPostion;
          slideHeight = this.slide.current.clientWidth;
        } else {
          slideTopToWrapper = top;
          WrapperTopToClient = this.scrollbarBox.current.getBoundingClientRect().top;
          dist = e.clientY - WrapperTopToClient - slideTopToWrapper - downPostion;
          slideHeight = this.slide.current.clientHeight;
        }
        slideTopToWrapper = slideTopToWrapper + dist;
        if (slideTopToWrapper < 0) {
          slideTopToWrapper = 0;
        } else if (slideTopToWrapper > height - slideHeight) {
          slideTopToWrapper = height - slideHeight;
        }
        direction === 'row' ? this.slide.current.style.left = slideTopToWrapper + 'px' :
          this.slide.current.style.top = slideTopToWrapper + 'px';
        const scrollDist = (totalLength - clientHeight) *
          (slideTopToWrapper / (height - slideHeight));
        this.props.onColumnScrollChange(scrollDist);
      }
    });
    window.addEventListener('mouseup', (e: MouseEvent) => {
      this.setState({
        isDown: false,
      });
    });
  }

  handleMouseDown = (e: React.MouseEvent) => {
    const { direction } = this.props;
    if (!this.slide.current) {
      return;
    }
    const downPostion = direction === 'row' ?
      e.clientX - this.slide.current.getBoundingClientRect().left :
      e.clientY - this.slide.current.getBoundingClientRect().top;
    this.setState({
      isDown: true,
      downPostion,
    });
  }

  render() {
    const minSlideLength = 100;
    const { height, totalLength, clientHeight, direction, offset } = this.props;
    const slideHeight = Math.max(clientHeight * height / totalLength, minSlideLength);
    const scrollbarBoxClass = direction === 'row' ? styles.scrollbarBoxRow : styles.scrollbarBox;
    const scrollbarBoxStyle = direction === 'row' ? { width: (height) } : { height: (height) };
    const scrollbarClass = direction === 'row' ? styles.scrollbarRow : styles.scrollbar;
    const scrollbarSlideRowClass = direction === 'row' ? styles.scrollbarSlideRow : styles.scrollbarSlide;
    const _offset = Math.min((offset / totalLength) * (clientHeight - slideHeight), clientHeight - slideHeight);
    const scrollbarBoxStyleStyle = direction === 'row' ?
      { top: 0, minWidth: slideHeight, left: _offset }
      : { top: _offset, minHeight: slideHeight };
    if (totalLength <= clientHeight) return null;
    return createElement(
      'div',
      {
        ref: this.scrollbarBox,
        style: {
          ...scrollbarBoxClass,
          ...scrollbarBoxStyle,
        }
      },
      createElement(
        'div',
        {
          style: scrollbarClass,
        },
        createElement(
          'div',
          {
            ref: this.slide,
            style: {
              ...scrollbarBoxStyleStyle,
              ...scrollbarSlideRowClass,
            },
            onMouseDown: this.handleMouseDown,
          }
        )
      )
    );
  }
}
