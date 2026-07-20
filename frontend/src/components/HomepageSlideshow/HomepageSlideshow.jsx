import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import styles from './HomepageSlideshow.module.css'

/**
 * HomepageSlideshow Component
 * Responsive slideshow with automatic transitions, navigation, and touch support
 * Requirements: 12.1, 12.6, 12.7
 */

const HomepageSlideshow = ({ slides, autoPlayInterval = 5000, showControls = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  const goToSlide = useCallback((index) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 500)
  }, [isTransitioning])

  const goToNext = useCallback(() => {
    if (!slides || slides.length === 0) return
    const nextIndex = (currentIndex + 1) % slides.length
    goToSlide(nextIndex)
  }, [currentIndex, slides, goToSlide])

  const goToPrevious = useCallback(() => {
    if (!slides || slides.length === 0) return
    const prevIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1
    goToSlide(prevIndex)
  }, [currentIndex, slides, goToSlide])

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || !slides || slides.length <= 1) return

    const interval = setInterval(() => {
      goToNext()
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [isAutoPlaying, autoPlayInterval, goToNext, slides])

  // Touch handlers for mobile swipe
  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrevious()
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrevious])

  if (!slides || slides.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No slides available</p>
      </div>
    )
  }

  return (
    <div 
      className={styles.slideshow}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      <div className={styles.slidesContainer}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`${styles.slide} ${index === currentIndex ? styles.active : ''}`}
          >
            <img
              src={slide.image_url}
              alt={slide.caption || `Slide ${index + 1}`}
              className={styles.slideImage}
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            {slide.caption && (
              <div className={styles.caption}>
                <p>{slide.caption}</p>
                {slide.link && (
                  <a 
                    href={slide.link} 
                    className={styles.captionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn More →
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      {showControls && slides.length > 1 && (
        <>
          <button
            className={`${styles.navButton} ${styles.prevButton}`}
            onClick={goToPrevious}
            aria-label="Previous slide"
            disabled={isTransitioning}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            className={`${styles.navButton} ${styles.nextButton}`}
            onClick={goToNext}
            aria-label="Next slide"
            disabled={isTransitioning}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className={styles.indicators}>
          {slides.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${index === currentIndex ? styles.activeIndicator : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              disabled={isTransitioning}
            />
          ))}
        </div>
      )}
    </div>
  )
}

HomepageSlideshow.propTypes = {
  slides: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      image_url: PropTypes.string.isRequired,
      caption: PropTypes.string,
      link: PropTypes.string,
      order: PropTypes.number,
      is_active: PropTypes.bool
    })
  ).isRequired,
  autoPlayInterval: PropTypes.number,
  showControls: PropTypes.bool
}

export default HomepageSlideshow
