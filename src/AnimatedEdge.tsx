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
}) => {
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

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
            </defs>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeWidth: 2,
                    stroke: '#bbb',
                    strokeDasharray: '8 4',
                    animation: `dash-${id.replace(/[^a-zA-Z0-9]/g, '_')} 1s linear infinite`,
                }}
            />
        </>
    );
};

export default AnimatedEdge;
