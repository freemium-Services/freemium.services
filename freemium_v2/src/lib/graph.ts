import { TOOLS, type Tool } from './data';

/**
 * Finds operationally similar tools based on shared infrastructure requirements.
 */
export function getOperationallySimilarTools(tool: Tool, limit = 4): Tool[] {
    return TOOLS
        .filter(t => t.id !== tool.id)
        .sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;

            if (a.category === tool.category) scoreA += 5;
            if (b.category === tool.category) scoreB += 5;

            if (a.gpuRequired === tool.gpuRequired) scoreA += 10;
            if (b.gpuRequired === tool.gpuRequired) scoreB += 10;

            if (a.license === tool.license) scoreA += 3;
            if (b.license === tool.license) scoreB += 3;

            return scoreB - scoreA;
        })
        .slice(0, limit);
}