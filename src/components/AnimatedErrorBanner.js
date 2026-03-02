import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './animatedErrorBanner.css';

const AnimatedErrorBanner = ({ message, visible, onHidden, role = 'alert' }) => {
  const [show, setShow] = useState(Boolean(message && visible));
  const nodeRef = useRef(null);

  useEffect(() => {
    if (message && visible) setShow(true);
    else if (!message && show) {
      // hide with transition then notify
      setShow(false);
      const t = setTimeout(() => {
        if (onHidden) onHidden();
      }, 320);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, visible]);

  return (
    <div ref={nodeRef} className={`animated-error-banner ${show ? 'visible' : ''}`} role={role} aria-live="assertive">
      {show && message}
    </div>
  );
};

AnimatedErrorBanner.propTypes = {
  message: PropTypes.string,
  visible: PropTypes.bool,
  onHidden: PropTypes.func,
  role: PropTypes.string,
};

export default AnimatedErrorBanner;
