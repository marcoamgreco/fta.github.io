import React from 'react';
import { BaseEdge, getSmoothStepPath } from 'reactflow';
import type { EdgeProps } from 'reactflow';

const AnimatedEdge: React.FC<EdgeProps> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}) => {
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Use custom color from data, or default to light gray
    const strokeColor = data?.strokeColor || '#bbb';
    const markerId = `arrow-custom-${id.replace(/[^a-zA-Z0-9]/g, '_')}`;

    return (
        <>
            <defs>
                <style>
                    {`
                        @keyframes dash-${id.replace(/[^a-zA-Z0-9]/g, '_')} {
                            to {
                                stroke-dashoffset: -20;
                            }
                        }
                    `}
                </style>
                {markerEnd && (
                    <marker
                        id={markerId}
                        markerWidth="12.5"
                        markerHeight="12.5"
                        viewBox="-10 -10 20 20"
                        markerUnits="strokeWidth"
                        orient="auto"
                        refX="0"
                        refY="0"
                    >
                        <path
                            d="M -5,-4 L 0,0 L -5,4 Z"
                            fill={strokeColor}
                            stroke={strokeColor}
                            strokeWidth="1"
                        />
                    </marker>
                )}
            </defs>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd ? `url(#${markerId})` : undefined}
                style={{
                    ...style,
                    strokeWidth: 2,
                    stroke: strokeColor,
                    strokeDasharray: '8 4',
                    animation: `dash-${id.replace(/[^a-zA-Z0-9]/g, '_')} 1s linear infinite`,
                }}
            />
        </>
    );
};

export default AnimatedEdge;
