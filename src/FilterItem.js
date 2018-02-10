import { 
  cloneDeep,
  transitionEndEvt,
} from './utils';

class FilterItem {
  /**
   * Constructor of FilterItem
   * @param {Object} $node is the jQuery node to create the FilterItem out of
   * @param {Number} index is the index of the FilterItem when iterating over them
   * @param {Object} options the options Filterizr was initialized with
   */
  constructor($node, index, options) {
    const {
      delay,
      delayMode,
      filterOutCss,
      animationDuration,
      easing
    } = options;

    // cache jQuery node
    this.$node = $node;

    // set props
    this.props = {
      data: (() => {
        // all data-attributes defined by the user, can be used for sorting
        const data = this.$node.data();
        // remove category and sort which could be there by API design
        delete data.category;
        delete data.sort;
        return data;
      })(),
      index,
      sortData: this.$node.data('sort'),
      lastPosition: { left: 0, top: 0 },
      filteredOut: false, // used for the onTransitionEnd event
      w: this.getWidth(),
      h: this.getHeight(),
    };

    // set initial styles
    this.$node
    // init to filtered out
      .css(filterOutCss)
    // additional styles needed by filterizr 
      .css({
        '-webkit-backface-visibility': 'hidden',
        'perspective': '1000px',
        '-webkit-perspective': '1000px',
        '-webkit-transform-style': 'preserve-3d',
        'position': 'absolute',
        'transition': `all ${animationDuration}s ${easing} ${this.calcDelay(delay, delayMode)}ms`,
      });

    // finally bind events
    this.bindEvents();
  }

  /**
   * Filters in a specific FilterItem out of the grid.
   * @param {Object} cssOptions for the animation
   */
  filterIn(targetPos, cssOptions) {
    // perform a deep clone of the filtering in css
    let filterInCss = cloneDeep(cssOptions);
    // enhance it with the target position towards which the item should animate
    filterInCss.transform += ' translate3d(' + targetPos.left + 'px,' + targetPos.top + 'px, 0)';
    // animate
    this.$node.css(filterInCss);
    // update last position to be the targetPos
    this.props.lastPosition = targetPos;
    // update state
    this.props.filteredOut = false;
  }

  /**
   * Filters out a specific FilterItem out of the grid.
   * @param {Object} cssOptions for the animation
   */
  filterOut(cssOptions) {
    // perform a deep clone of the filtering out css
    let filterOutCss = cloneDeep(cssOptions);
    const { lastPosition } = this.props;
    //Auto add translate to transform over user-defined filterOut styles
    filterOutCss.transform += ' translate3d(' + lastPosition.left + 'px,' + lastPosition.top + 'px, 0)';
    //Play animation
    this.$node.css(filterOutCss);
    // update state
    this.props.filteredOut = true;
  }

  /**
   * Helper method to calculate the animation delay for a given .filtr-item
   * @param {Number} delay in ms
   * @param {String} delayMode can be 'alternate' or 'progressive'
   * @return {Number} delay in ms
   */
  calcDelay(delay, delayMode) {
    let ret = 0;

    if (delayMode === 'progressive') {
      ret = delay * this.props.index;
    }
    else {
      if (this.props.index % 2 === 0) ret = delay;
    }

    return ret;
  }

  /**
   * Returns true if the text contents of the FilterItem match the search term
   * @param {String} searchTerm - the search term
   * @return {Boolean} if the innerText matches the term
   */
  contentsMatchSearch(searchTerm) {
    return ~this.getContentsLowercase().lastIndexOf(searchTerm);
  }

  /**
   * Helper method for the search method of Filterizr
   */
  getContentsLowercase() {
    return this.$node.text().toLowerCase();
  }

  /**
   * Returns all categories of the .filtr-item data-category attribute
   * with a regexp regarding all whitespace.
   */
  getCategories() {
    return this.$node.attr('data-category').split(/\s*,\s*/g);
  }

  /**
   * Wrapper around jQuery's innerHeight to calculate the item's width
   */
  getHeight() {
    return this.$node.innerHeight();
  }

  /**
   * Wrapper around jQuery's innerWidth to calculate the item's width
   */
  getWidth() {
    return this.$node.innerWidth();
  }

  /**
   * Wrapper around jQuery's trigger
   * @param {String} evt the name of the event to trigger
   */
  trigger(evt) {
    this.$node.trigger(evt);
  }

  /**
   * Recalculates the dimensions of the element and updates them in the state
   */
  updateDimensions() {
    this.props.w = this.getWidth();
    this.props.h = this.getHeight();
  }

  /**
   * Sets up the events related to the FilterItem instance
   */
  bindEvents() {
    this.$node.on(transitionEndEvt, () => {
      // On transitionEnd determine if the item is filtered out or not,
      // in case it is add the .filteredOut class for easy targeting by
      // the user and set the z-index to -1000 to prevent mouse events
      // from being intercepted.
      const { filteredOut } = this.props;
      this.$node.toggleClass('filteredOut', filteredOut);
      this.$node.css('z-index', filteredOut ? -1000 : '');
    });
  }

  /**
   * Removes all events related to the FilterItem instance
   */
  unbindEvents() {
    this.$node.off(transitionEndEvt);
  }
}

export default FilterItem;
