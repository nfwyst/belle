import React, {Component, PropTypes} from 'react';
import {injectStyles, removeAllStyles} from '../utils/inject-style';
import unionClassNames from '../utils/union-class-names';
import {has, map, shift, reverse, omit} from '../utils/helpers';
import {getWeekArrayForMonth, getLocaleData, CURRENT_DATE, CURRENT_MONTH, CURRENT_YEAR} from '../utils/date-helpers';
import defaultStyle from '../style/date-picker';
import config from '../config/datePicker';

/**
 * Returns an object with properties that are relevant for the wrapping div of the date picker.
 */
function sanitizeWrapperProps(properties) {
  return omit(properties, [
    'tabIndex',
    'onFocus',
    'onBlur',
    'onMouseDown',
    'onMouseUp',
    'onMouseOver',
    'onMouseOut',
    'onTouchStart',
    'onTouchEnd',
    'disabled',
    'style',
    'className'
  ]);
}

/**
 * Returns an object with properties that are relevant for day span.
 */
function sanitizeDayProps(properties) {
  return omit(properties, [
    'tabIndex',
    'key',
    'ref',
    'onBlur',
    'onFocus',
    'onMouseDown',
    'onMouseUp',
    'onMouseOver',
    'onMouseOut',
    'onTouchStart',
    'onTouchEnd',
    'onKeyDown',
    'style',
    'className'
  ]);
}

/**
 * Injects pseudo classes for styles into the DOM.
 */
function updatePseudoClassStyle(pseudoStyleIds, properties, preventFocusStyleForTouchAndClick) {
  const styles = [{
    id: pseudoStyleIds.prevMonthNavStyleId,
    style: {
      ...defaultStyle.hoverPrevMonthNavStyle,
      ...properties.hoverPrevMonthNavStyle
    },
    pseudoClass: 'hover'

  }, {
    id: pseudoStyleIds.nextMonthNavStyleId,
    style: {
      ...defaultStyle.hoverNextMonthNavStyle,
      ...properties.hoverNextMonthNavStyle
    },
    pseudoClass: 'hover'
  }];
  let focusStyle;
  if (preventFocusStyleForTouchAndClick) {
    focusStyle = { outline: 0 };
  } else {
    focusStyle = {
      ...defaultStyle.focusStyle,
      ...properties.focusStyle
    };
  }
  styles.push({
    id: pseudoStyleIds.styleId,
    style: focusStyle,
    pseudoClass: 'focus'
  });
  injectStyles(styles);
}

/**
 * DatePicker React Component.
 */
export default class DatePicker extends Component {

  constructor(properties) {
    super(properties);
    let dateValue;

    if (has(properties, 'valueLink')) {
      dateValue = properties.valueLink.value;
    } else if (has(properties, 'value')) {
      dateValue = properties.value;
    } else if (has(properties, 'defaultValue')) {
      dateValue = properties.defaultValue;
    }

    this.state = {
      dateValue: dateValue,
      month: properties.month - 1,
      year: properties.year,
      localeData: getLocaleData(properties.locale),
      wrapperProps: sanitizeWrapperProps(properties.wrapperProps),
      dayProps: sanitizeDayProps(properties.dayProps),
      preventFocusStyleForTouchAndClick: has(properties, 'preventFocusStyleForTouchAndClick') ? properties.preventFocusStyleForTouchAndClick : config.preventFocusStyleForTouchAndClick
    };
  }

  static displayName = 'DatePicker';

  static propTypes = {
    // value related props
    defaultValue: PropTypes.instanceOf(Date),
    value: PropTypes.instanceOf(Date),
    valueLink: PropTypes.shape({
      value: PropTypes.instanceOf(Date),
      requestChange: PropTypes.func.isRequired
    }),
    // component config related props
    locale: PropTypes.string,
    month: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    year: PropTypes.number,
    showOtherMonthDate: PropTypes.bool,
    styleWeekend: PropTypes.bool,
    renderDay: PropTypes.func,
    tabIndex: PropTypes.number,
    'aria-label': PropTypes.string,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    preventFocusStyleForTouchAndClick: PropTypes.bool,
    // event callbacks
    onDayFocus: PropTypes.func,
    onDayBlur: PropTypes.func,
    onDayKeyDown: PropTypes.func,
    onDayMouseDown: PropTypes.func,
    onDayMouseUp: PropTypes.func,
    onDayTouchStart: PropTypes.func,
    onDayTouchEnd: PropTypes.func,
    onUpdate: PropTypes.func,
    onMonthChange: PropTypes.func,
    // props for wrapper and day
    wrapperProps: PropTypes.object,
    dayProps: PropTypes.object,
    // ClassNames
    wrapperClassName: PropTypes.string,
    navBarClassName: PropTypes.string,
    prevMonthNavClassName: PropTypes.string,
    nextMonthNavClassName: PropTypes.string,
    monthLabelClassName: PropTypes.string,
    dayLabelClassName: PropTypes.string,
    dayClassName: PropTypes.string,
    // wrapper styles
    style: PropTypes.object,
    disabledStyle: PropTypes.object,
    readOnlyStyle: PropTypes.object,
    hoverStyle: PropTypes.object,
    activeStyle: PropTypes.object,
    focusStyle: PropTypes.object,
    disabledHoverStyle: PropTypes.object,
    // navbar styles
    navBarStyle: PropTypes.object,
    // prevMonthNav styles
    prevMonthNavStyle: PropTypes.object,
    hoverPrevMonthNavStyle: PropTypes.object,
    activePrevMonthNavStyle: PropTypes.object,
    // nextMonthNav styles
    nextMonthNavStyle: PropTypes.object,
    hoverNextMonthNavStyle: PropTypes.object,
    activeNextMonthNavStyle: PropTypes.object,
    // monthlbl styles
    monthLabelStyle: PropTypes.object,
    // daylbl styles
    dayLabelStyle: PropTypes.object,
    disabledDayLabelStyle: PropTypes.object,
    weekendLabelStyle: PropTypes.object,
    // day styles
    dayStyle: PropTypes.object,
    disabledDayStyle: PropTypes.object,
    readOnlyDayStyle: PropTypes.object,
    hoverDayStyle: PropTypes.object,
    activeDayStyle: PropTypes.object,
    focusDayStyle: PropTypes.object,
    disabledHoverDayStyle: PropTypes.object,
    todayStyle: PropTypes.object,
    selectedDayStyle: PropTypes.object,
    otherMonthDayStyle: PropTypes.object,
    weekendStyle: PropTypes.object
  };

  static defaultProps = {
    month: CURRENT_MONTH + 1,
    year: CURRENT_YEAR,
    tabIndex: 0,
    'aria-label': 'datepicker',
    disabled: false,
    readOnly: false,
    showOtherMonthDate: true,
    styleWeekend: false
  };

  /**
   * Generates the style-id based on React's unique DOM node id.
   * Calls function to inject the pseudo classes into the dom.
   */
  componentWillMount() {
    const id = this._reactInternalInstance._rootNodeID.replace(/\./g, '-');
    this.pseudoStyleIds = {};
    this.pseudoStyleIds.styleId = `wrapper-style-id${id}`;
    this.pseudoStyleIds.prevMonthNavStyleId = `prevMonthNav-style-id${id}`;
    this.pseudoStyleIds.nextMonthNavStyleId = `nextMonthNav-style-id${id}`;
    updatePseudoClassStyle(this.pseudoStyleIds, this.props, this.state.preventFocusStyleForTouchAndClick);
  }

  /**
   * Function will update component state and styles as new props are received.
   */
  componentWillReceiveProps(properties) {
    const newState = {
      month: properties.month - 1,
      year: properties.year,
      localeData: getLocaleData(properties.locale),
      wrapperProps: sanitizeWrapperProps(properties.wrapperProps),
      dayProps: sanitizeDayProps(properties.dayProps),
      preventFocusStyleForTouchAndClick: has(properties, 'preventFocusStyleForTouchAndClick') ? properties.preventFocusStyleForTouchAndClick : config.preventFocusStyleForTouchAndClick
    };

    if (has(properties, 'valueLink')) {
      newState.dateValue = properties.valueLink.value;
    } else if (has(properties, 'value')) {
      newState.dateValue = properties.value;
    }

    this.setState(newState);

    removeAllStyles(Object.keys(this.pseudoStyleIds));
    updatePseudoClassStyle(this.pseudoStyleIds, properties, this.state.preventFocusStyleForTouchAndClick);
  }

  /**
   * Removes pseudo classes from the DOM once component gets unmounted.
   */
  componentWillUnmount() {
    removeAllStyles(Object.keys(this.pseudoStyleIds));
  }

  /**
   * Callback is called when wrapper is focused, it will conditionally set isWrapperFocused.
   * this.state.focusedDay will be set to current date of whichever month is displayed on date-picker (if this.state.focusedDay is undefined).
   */
  _onWrapperFocus() {
    if (!this.props.disabled && !this.state.isWrapperActive) {
      const newState = {
        isWrapperFocused: true
      };
      if (!this.state.focusedDay) {
        newState.focusedDay = this.state.month + 1 + '/' + CURRENT_DATE + '/' + CURRENT_YEAR;
      }
      this.setState(newState);
    }
  }

  /**
   * Callback is called when wrapper is blurred, it will reset isWrapperFocused, focusedDay.
   */
  _onWrapperBlur() {
    if (!this.props.disabled) {
      this.setState({
        isWrapperFocused: false,
        focusedDay: undefined
      });
    }
  }

  /**
   * Callback is called when wrapper receives mouseDown. Conditionally set isWrapperActive.
   */
  _onWrapperMouseDown(event) {
    if (!this.props.disabled && event.button === 0) {
      this.setState({
        isWrapperActive: true
      });
    }
  }

  /**
   * Callback is called when wrapper receives mouseUp. Reset isWrapperActive.
   */
  _onWrapperMouseUp(event) {
    if (!this.props.disabled && event.button === 0) {
      this.setState({
        isWrapperActive: false
      });
    }
  }

  /**
   * Callback is called when mouse enters wrapper. Conditionally set isWrapperHovered.
   */
  _onWrapperMouseOver() {
    this.setState({
      isWrapperHovered: true
    });
  }

  /**
   * Callback is called when mouse leaves wrapper. Reset isWrapperHovered.
   */
  _onWrapperMouseOut() {
    this.setState({
      isWrapperHovered: false
    });
  }

  /**
   * Callback is called when touch starts on wrapper. Conditionally sets isWrapperActive.
   */
  _onWrapperTouchStart(event) {
    if (!this.props.disabled && event.touches.length === 1) {
      this.setState({
        isWrapperActive: true
      });
    }
  }

  /**
   * Callback is called when touch ends on wrapper. Reset isWrapperActive.
   */
  _onWrapperTouchEnd() {
    if (!this.props.disabled) {
      this.setState({
        isWrapperActive: false
      });
    }
  }

  /**
   * On keyDown on wrapper if some day is focused:
   * 1. arrow keys will navigate calendar
   * 2. enter key will set dateValue of component
   * 3. space key will set / unset dateValue
   * 4. props.onDayKeyDown will be called
   */
  _onWrapperKeyDown(event) {
    if (this.state.focusedDay) {
      if (!this.props.disabled) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          this._focusOtherDay(7);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          this._focusOtherDay(-7);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          this._focusOtherDay(this.state.localeData.isRTL ? 1 : -1);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          this._focusOtherDay(this.state.localeData.isRTL ? -1 : 1);
        } else if (event.key === 'Enter') {
          event.preventDefault();
          this._triggerSelectDate(new Date(this.state.focusedDay).getDate());
        } else if (event.key === ' ') {
          event.preventDefault();
          this._triggerToggleDate(new Date(this.state.focusedDay));
        }
      }

      if (this.props.onDayKeyDown) {
        this.props.onDayKeyDown(event);
      }
    }
  }

  // mouseEvent.button is supported by all browsers are are targeting: https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
  /**
   * Callback is called when some day receives mouseDown.
   * It will conditionally set this.state.activeDay, this.state.focusedDay and call props.onDayMouseDown.
   */
  _onDayMouseDown(dayKey, day, event) {
    if (event.button === 0 && !this.props.disabled && !this.props.readOnly) {
      this._triggerSelectDate(day);
      this.setState({
        activeDay: dayKey,
        focusedDay: dayKey
      });
    }

    if (this.props.onDayMouseDown) {
      this.props.onDayMouseDown(event);
    }
  }

  /**
   * Callback is called when some day receives mouseUp.
   * It will reset this.state.activeDay and call props.onDayMouseUp.
   */
  _onDayMouseUp(dayKey, event) {
    if (event.button === 0 && !this.props.disabled && !this.props.readOnly && this.state.activeDay === dayKey) {
      this.setState({
        activeDay: null
      });
    }

    if (this.props.onDayMouseUp) {
      this.props.onDayMouseUp(event);
    }
  }

  /**
   * Callback is called when some day receives MouseOver. It will conditionally set this.state.hoveredDay.
   */
  _onDayMouseOver(dayKey) {
    if (!this.props.disabled && !this.props.readOnly) {
      this.setState({
        hoveredDay: dayKey
      });
    }
  }

  /**
   * Callback is called when some day receives MouseOut. It will reset this.state.hoveredDay.
   */
  _onDayMouseOut(dayKey, event) {
    if (!this.props.disabled && !this.props.readOnly && event.button === 0 && this.state.hoveredDay === dayKey) {
      this.setState({
        hoveredDay: 0
      });
    }
  }

  /**
   * Callback is called when some day receives touchStart.
   * It will conditionally set this.state.activeDay and call props.onDayTouchStart.
   */
  _onDayTouchStart(dayKey, day, event) {
    if (!this.props.disabled && !this.props.readOnly && event.touches.length === 1) {
      this._triggerSelectDate(day);
      this.setState({
        activeDay: dayKey
      });
    }

    if (this.props.onDayTouchStart) {
      this.props.onDayTouchStart(event);
    }
  }

  /**
   * Callback is called when some day receives touchEnd.
   * It will reset this.state.activeDay and call props.onDayTouchEnd.
   */
  _onDayTouchEnd(dayKey, event) {
    if (!this.props.disabled && !this.props.readOnly && event.touches.length === 1 && this.state.activeDay === dayKey) {
      this.setState({
        activeDay: null
      });
    }

    if (this.props.onDayTouchEnd) {
      this.props.onDayTouchEnd(event);
    }
  }

  /**
   * Depending on whether component is controlled or uncontrolled the function will update this.state.dateValue.
   * It will also call props.onUpdate.
   */
  _triggerSelectDate(date) {
    if (!this.props.disabled && !this.props.readOnly) {
      let dateValue;
      if (date) {
        dateValue = new Date(this.state.year, this.state.month, date);
      }
      if (has(this.props, 'valueLink')) {
        this.props.valueLink.requestChange(dateValue);
      } else if (!has(this.props, 'value')) {
        this.setState({
          dateValue: dateValue
        });
      }

      if (this.props.onUpdate) {
        this.props.onUpdate({
          value: dateValue
        });
      }
    }
  }

  /**
   * Function will select / deselect date passed to it, it is used in case of 'Space' keyDown on a day.
   */
  _triggerToggleDate(date) {
    if (!this.props.disabled && !this.props.readOnly) {
      let dateValue;
      if (this.state.dateValue && date && this.state.dateValue.getDate() === date.getDate() && this.state.dateValue.getMonth() === date.getMonth() && this.state.dateValue.getYear() === date.getYear()) {
        dateValue = undefined;
      } else {
        dateValue = date.getDate();
      }
      this._triggerSelectDate(dateValue);
    }
  }

  /**
   * The function is mainly used when some day is focused and Arrow keys are pressed to navigate to some other day.
   * days is the number of days by which focused should be moved ahead or behind.
   */
  _focusOtherDay(days) {
    const currentFocusedDay = new Date(this.state.focusedDay);
    const currentMonth = currentFocusedDay.getMonth();
    currentFocusedDay.setDate(currentFocusedDay.getDate() + days);
    const currentFocusedDayKey = (currentFocusedDay.getMonth() + 1) + '/' + currentFocusedDay.getDate() + '/' + currentFocusedDay.getFullYear();
    if (currentFocusedDay.getMonth() < currentMonth) {
      this._decreaseMonth();
    } else if (currentFocusedDay.getMonth() > currentMonth) {
      this._increaseMonth();
    }
    this.setState({
      focusedDay: currentFocusedDayKey
    });
  }

  /**
   * Callback is called when prevMonthNav receives mouse down.
   * If component is not disabled it will decrease the month and set active state for prevMonthNav.
   */
  _onPrevMonthNavMouseDown(event) {
    if (event.button === 0 && !this.props.disabled) {
      this._decreaseMonth();
      this.setState({
        isPrevMonthNavActive: true
      });
    }
  }

  /**
   * Callback is called when prevMonthNav receives mouse up.
   * It will reset active state for prevMonthNav.
   */
  _onPrevMonthNavMouseUp(event) {
    if (event.button === 0 && !this.props.disabled) {
      this.setState({
        isPrevMonthNavActive: false
      });
    }
  }

  /**
   * Callback is called when prevMonthNav receives touch start.
   * If component is not disabled it will decrease the month and set active state for prevMonthNav.
   */
  _onPrevMonthNavTouchStart(event) {
    if (!this.props.disabled && event.touches.length === 1) {
      this._decreaseMonth();
      this.setState({
        isPrevMonthNavActive: true
      });
    }
  }

  /**
   * Callback is called when prevMonthNav receives touch end. It will reset active state for prevMonthNav.
   */
  _onPrevMonthNavTouchEnd() {
    if (!this.props.disabled) {
      this.setState({
        isPrevMonthNavActive: false
      });
    }
  }

  /**
   * Callback is called when nextMonthNav receives mouseDown.
   * If component is not disabled it will increase the month and set active state for nextMonthNav.
   */
  _onNextMonthNavMouseDown(event) {
    if (event.button === 0 && !this.props.disabled) {
      this._increaseMonth();
      this.setState({
        isNextMonthNavActive: true
      });
    }
  }

  /**
   * Callback is called when nextMonthNav receives mouse up. It will reset active state for nextMonthNav.
   */
  _onNextMonthNavMouseUp(event) {
    if (event.button === 0 && !this.props.disabled) {
      this.setState({
        isNextMonthNavActive: false
      });
    }
  }

  /**
   * Callback is called when nextMonthNav receives touch start.
   * If component is not disabled it will increase the month and set active state for nextMonthNav.
   */
  _onNextMonthNavTouchStart(event) {
    if (!this.props.disabled && event.touches.length === 1) {
      this._increaseMonth();
      this.setState({
        isNextMonthNavActive: true
      });
    }
  }

  /**
   * Callback is called when nextMonthNav receives touch end. It will reset active state for nextMonthNav.
   */
  _onNextMonthNavTouchEnd() {
    if (!this.props.disabled) {
      this.setState({
        isNextMonthNavActive: false
      });
    }
  }

  /**
   * The function will decrease current month in state. It will also call props.onMonthChange.
   */
  _decreaseMonth() {
    let newMonth;
    let newYear;
    if (this.state.month === 0) {
      newMonth = 11;
      newYear = this.state.year - 1;
    } else {
      newMonth = this.state.month - 1;
      newYear = this.state.year;
    }
    this.setState({
      month: newMonth,
      year: newYear
    });
    if (this.props.onMonthChange) {
      this.props.onMonthChange(newMonth + 1);
    }
  }

  /**
   * The function will increase current month in state. It will also call props.onMonthChange.
   */
  _increaseMonth() {
    let newMonth;
    let newYear;
    if (this.state.month === 11) {
      newMonth = 0;
      newYear = this.state.year + 1;
    } else {
      newMonth = this.state.month + 1;
      newYear = this.state.year;
    }
    this.setState({
      month: newMonth,
      year: newYear
    });
    if (this.props.onMonthChange) {
      this.props.onMonthChange(newMonth + 1);
    }
  }

  _renderPrevMonthNav(prevMonthNavStyle) {
    if (this.props.disabled) return undefined;
    return (
      <div onMouseDown={ this._onPrevMonthNavMouseDown.bind(this) }
           onMouseUp={ this._onPrevMonthNavMouseUp.bind(this) }
           onTouchStart={ this._onPrevMonthNavTouchStart.bind(this) }
           onTouchEnd={ this._onPrevMonthNavTouchEnd.bind(this) }
           style={ prevMonthNavStyle }
           className={ unionClassNames(this.props.prevMonthNavClassName, this.pseudoStyleIds.prevMonthNavStyleId) }>
        left
      </div>
    );
  }

  _renderNextMonthNav(nextMonthNavStyle) {
    if (this.props.disabled) return undefined;
    return (
      <div onMouseDown={ this._onNextMonthNavMouseDown.bind(this) }
            onMouseUp={ this._onNextMonthNavMouseUp.bind(this) }
            onTouchStart={ this._onNextMonthNavTouchStart.bind(this) }
            onTouchEnd={ this._onNextMonthNavTouchEnd.bind(this) }
            style= { nextMonthNavStyle }
            className={ unionClassNames(this.props.nextMonthNavClassName, this.pseudoStyleIds.nextMonthNavStyleId) }>
        right
      </div>
    );
  }

  /**
   * Function will return jsx for rendering the nav bar for calendar.
   * Depending on following rules it will apply styles to prevMonthNav and nextMonthNav:
   * 1. If disabled hide navs
   * 2. If active apply activeStyles
   */
  _renderNavBar() {
    const navBarStyle = {
      ...defaultStyle.navBarStyle,
      ...this.props.navBarStyle
    };
    const monthLabelStyle = {
      ...defaultStyle.monthLabelStyle,
      ...this.props.monthLabelStyle
    };
    let prevMonthNavStyle = {
      ...defaultStyle.prevMonthNavStyle,
      ...this.props.prevMonthNavStyle
    };
    let nextMonthNavStyle = {
      ...defaultStyle.nextMonthNavStyle,
      ...this.props.nextMonthNavStyle
    };
    if (this.state.isPrevMonthNavActive) {
      prevMonthNavStyle = {
        ...prevMonthNavStyle,
        ...defaultStyle.activePrevMonthNavStyle,
        ...this.props.activePrevMonthNavStyle
      };
    } else if (this.state.isNextMonthNavActive) {
      nextMonthNavStyle = {
        ...nextMonthNavStyle,
        ...defaultStyle.activeNextMonthNavStyle,
        ...this.props.activeNextMonthNavStyle
      };
    }

    return (
      <div style={ navBarStyle }
           className={ this.props.navBarClassName }>
        { this._renderPrevMonthNav(prevMonthNavStyle) }
        <span style={ monthLabelStyle }
              className={ this.props.monthLabelClassName }
              role="heading"
              /*
                This label has an id as suggested in http://www.w3.org/TR/wai-aria-practices/#datepicker
              */
              id={ `${this.state.month}-${this.state.year}` }>
          { `${this.state.localeData.monthNames[this.state.month]} ${this.state.year}` }
        </span>
        { this._renderNextMonthNav(nextMonthNavStyle) }
      </div>
    );
  }

  /**
   * Function will return jsx for rendering the week header for calendar.
   * Disabled styles will be applied for disabled date-picker.
   * Day headers will be rendered using locale information.
   */
  _renderWeekHeader() {
    let dayLabelStyle = {
      ...defaultStyle.dayLabelStyle,
      ...this.props.dayLabelStyle
    };
    if (this.props.disabled) {
      dayLabelStyle = {
        ...dayLabelStyle,
        ...defaultStyle.disabledDayLabelStyle,
        ...this.props.disabledDayLabelStyle
      };
    }
    const weekendLabelStyle = {
      ...dayLabelStyle,
      ...defaultStyle.weekendLabelStyle,
      ...this.props.weekendLabelStyle
    };
    let dayNames = shift(this.state.localeData.dayNamesMin, this.state.localeData.firstDay);
    dayNames = this.state.localeData.isRTL ? reverse(dayNames) : dayNames;
    let weekendIndex = ((7 - this.state.localeData.firstDay) % 7) + this.state.localeData.weekEnd;
    weekendIndex = this.state.localeData.isRTL ? 6 - weekendIndex : weekendIndex;

    return (
      <div style={ defaultStyle.weekStyle }>
        {
          map(dayNames, (dayAbbr, index) => {
            return (
              <span key={ 'dayAbbr-' + index }
                    style={ (this.props.styleWeekend && index === weekendIndex) ? weekendLabelStyle : dayLabelStyle }
                    className={ this.props.dayLabelClassName }
                    role="columnheader">
                  { dayAbbr }
                </span>
            );
          })
        }
      </div>
    );
  }

  // According to http://www.w3.org/TR/wai-aria-1.1/#aria-current an empty value for aria-current indicated false.
  /**
   * Function will return jsx for rendering the a day.
   * It will apply various styles in sequence as below (styles will be additive):
   * 1. If component is readOnly apply readOnly styles
   * 2. If component is disabled apply disabled styles
   *    - If component is disabled and hovered apply disableHover styles
   * 3. If day is weekend apply weekendStyle
   * 4. If its day in current month and component is not disabled or readOnly:
   *    - If its current day apply todayStyle
   *    - If this is selected day apply selectedDayStyle
   *    - If component is hovered apply hover styles
   *    - If component is hovered and active apply hoveredStyles + activeStyles
   *    - If component is hovered and not active but focused and preventFocusStyleForTouchAndClick apply focus styles
   * 5. If current day represents other months day in calendar apply otherMonthDayStyle
   */
  _renderDay(currentDate, index) {
    const day = currentDate.getDate();
    const isNotOtherMonth = currentDate.getMonth() === this.state.month;
    const dayKey = (currentDate.getMonth() + 1) + '/' + currentDate.getDate() + '/' + currentDate.getFullYear();

    let ariaCurrent = '';
    let ariaSelected = false;

    let dayStyle = {
      ...defaultStyle.dayStyle,
      ...this.props.dayStyle
    };

    if (this.props.readOnly) {
      dayStyle = {
        ...dayStyle,
        ...defaultStyle.readOnlyDayStyle,
        ...this.props.readOnlyDayStyle
      };
    }

    if (this.props.disabled) {
      dayStyle = {
        ...dayStyle,
        ...defaultStyle.disabledDayStyle,
        ...this.props.disabledDayStyle
      };
      if (isNotOtherMonth && this.state.hoveredDay === dayKey) {
        dayStyle = {
          ...dayStyle,
          ...defaultStyle.disabledHoverDayStyle,
          ...this.props.disabledHoverDayStyle
        };
      }
    }

    if (this.props.styleWeekend && currentDate.getDay() === this.state.localeData.weekEnd) {
      dayStyle = {
        ...dayStyle,
        ...defaultStyle.weekendStyle,
        ...this.props.weekendStyle
      };
    }

    if (isNotOtherMonth) {
      if (day === CURRENT_DATE && this.state.month === CURRENT_MONTH && this.state.year === CURRENT_YEAR) {
        dayStyle = {
          ...dayStyle,
          ...defaultStyle.todayStyle,
          ...this.props.todayStyle
        };
        ariaCurrent = 'date';
      }
      if (this.state.dateValue && day === this.state.dateValue.getDate()
        && currentDate.getMonth() === this.state.dateValue.getMonth() && currentDate.getYear() === this.state.dateValue.getYear()) {
        dayStyle = {
          ...dayStyle,
          ...defaultStyle.selectedDayStyle,
          ...this.props.selectedDayStyle
        };
        ariaSelected = true;
      }
      if (!this.props.disabled && this.state.hoveredDay === dayKey) {
        dayStyle = {
          ...dayStyle,
          ...defaultStyle.hoverDayStyle,
          ...this.props.hoverDayStyle
        };
      }
      if (!this.props.disabled && this.state.focusedDay === dayKey) {
        dayStyle = {
          ...dayStyle,
          outline: 0
        };
        dayStyle = {
          ...dayStyle,
          ...defaultStyle.focusDayStyle,
          ...this.props.focusDayStyle
        };
      }
      if (!this.props.disabled && !this.props.readOnly && this.state.activeDay === dayKey) {
        dayStyle = {
          ...dayStyle,
          ...defaultStyle.activeDayStyle,
          ...this.props.activeDayStyle
        };
      }
    } else {
      dayStyle = {
        ...dayStyle,
        ...defaultStyle.otherMonthDayStyle,
        ...this.props.otherMonthDayStyle
      };
    }

    if (isNotOtherMonth) {
      return (
        <span key={ 'day-' + index }
              ref={ dayKey }
              onMouseDown={ this._onDayMouseDown.bind(this, dayKey, day) }
              onMouseUp={ this._onDayMouseUp.bind(this, dayKey) }
              onMouseOver={ this._onDayMouseOver.bind(this, dayKey) }
              onMouseOut={ this._onDayMouseOut.bind(this, dayKey) }
              onTouchStart={ this._onDayTouchStart.bind(this, dayKey, day) }
              onTouchEnd={ this._onDayTouchEnd.bind(this, dayKey) }
              aria-current={ ariaCurrent }
              aria-selected={ ariaSelected }
              style={ dayStyle }
              className={ this.props.dayClassName }
              role="gridcell"
          {...this.state.dayProps} >
          { this.props.renderDay ? this.props.renderDay(currentDate) : day }
        </span>
      );
    }

    const renderedDay = this.props.renderDay ? this.props.renderDay(currentDate) : day;
    return (
      <span key={ 'day-' + index }
            style={ dayStyle }
            className={ this.props.dayClassName }
            role="gridcell"
        {...this.state.dayProps} >
        { this.props.showOtherMonthDate ? renderedDay : ''}
      </span>
    );
  }

  /**
   * Function will render:
   * - main calendar component
   * - call methods to render navBar and week header
   * - get array of weeks in a month and for each day in the week call method to render day
   *
   * It will apply styles sequentially according to Wrapper according to following rules:
   * 1. If component is readOnly apply readOnlyStyle
   * 2. If component is disabled apply disabledStyle
   *    - If disabled component is hovered apply disabledHoverStyle
   * 3. If component is not disabled:
   *    - If component is hovered apply hover style
   *    - If component is hovered and active apply hover + active styles
   *    - If component is hovered and focused but not active and preventFocusStyleForTouchAndClick is true apply focusStyles
   */
  render() {
    let style = {
      ...defaultStyle.style,
      ...this.props.style
    };
    if (this.props.readOnly) {
      style = {
        ...style,
        ...defaultStyle.readOnlyStyle,
        ...this.props.readOnlyStyle
      };
    }
    if (this.props.disabled) {
      style = {
        ...style,
        ...defaultStyle.disabledStyle,
        ...this.props.disabledStyle
      };
      if (this.state.isWrapperHovered) {
        style = {
          ...style,
          ...defaultStyle.disabledHoverStyle,
          ...this.props.disabledHoverStyle
        };
      }
    } else {
      if (this.state.isWrapperHovered) {
        style = {
          ...style,
          ...defaultStyle.hoverStyle,
          ...this.props.hoverStyle
        };
      }
      if (this.state.isWrapperActive) {
        style = {
          ...style,
          ...defaultStyle.activeStyle,
          ...this.props.activeStyle
        };
      } else if (this.state.preventFocusStyleForTouchAndClick && this.state.isWrapperFocused) {
        style = {
          ...style,
          ...defaultStyle.focusStyle,
          ...this.props.focusStyle
        };
      }
    }

    const weekArray = getWeekArrayForMonth(this.state.month, this.state.year, this.state.localeData.firstDay);
    const tabIndex = !this.props.disabled ? this.props.tabIndex : false;

    return (
      <div ref="datePicker"
           tabIndex={ tabIndex }
           onFocus={ this._onWrapperFocus.bind(this) }
           onBlur={ this._onWrapperBlur.bind(this) }
           onKeyDown={ this._onWrapperKeyDown.bind(this) }
           onMouseDown={ this._onWrapperMouseDown.bind(this) }
           onMouseUp={ this._onWrapperMouseUp.bind(this) }
           onMouseOver={ this._onWrapperMouseOver.bind(this) }
           onMouseOut={ this._onWrapperMouseOut.bind(this) }
           onTouchStart={ this._onWrapperTouchStart.bind(this) }
           onTouchEnd={ this._onWrapperTouchEnd.bind(this) }
           disabled={ this.props.disabled }
           aria-label={ this.props['aria-label'] }
           aria-disabled={ this.props.disabled }
           aria-readonly={ this.props.readOnly }
           style={ style }
           className={ unionClassNames(this.props.wrapperClassName, this.pseudoStyleIds.styleId) }
           {...this.state.wrapperProps} >
        { this._renderNavBar() }
        <div role="grid" style={ defaultStyle.weekGroupStyle}>
          { this._renderWeekHeader() }
          {
            map(weekArray, (week, weekIndex) => {
              const weekDays = this.state.localeData.isRTL ? reverse(week) : week;
              return (
                <div key={ 'week-' + weekIndex }
                     style={ defaultStyle.weekStyle }>
                  {
                    map(weekDays, (day, dayIndex) => {
                      return this._renderDay(day, dayIndex);
                    })
                  }
                </div>
              );
            })
          }
        </div>
      </div>
    );
  }
}
