// components/LoadingPlaceholder.js
import React from 'react';

const LoadingPlaceholder = ({ width = '100%', height = '100%' }) => (
  <div className="shimmer-wrapper bg-blue-600" style={{ width, height }}>
    <div className="shimmer"></div>
    <style jsx>{`
      .shimmer-wrapper {
        background-color: #f6f7f8;
        position: relative;
        overflow: hidden;
      }
      .shimmer {
        width: 100%;
        height: 100%;
        background: linear-gradient(
          to right,
          oklch(0.70 0.20 262.881) 0%,
          oklch(0.546 0.245 262.881) 20%,
          oklch(0.70 0.20 262.881) 40%,
          oklch(0.70 0.20 262.881) 100%
        );
        background-size: 800px 104px;
        animation: shimmer 1.5s infinite linear;
      }
      @keyframes shimmer {
        0% {
          background-position: -800px 0;
        }
        100% {
          background-position: 800px 0;
        }
      }
    `}</style>
    
  </div>
);

export default LoadingPlaceholder;
