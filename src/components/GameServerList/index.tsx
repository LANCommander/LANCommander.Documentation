import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {useDocsData} from '@docusaurus/plugin-content-docs/client';
import {usePluginData} from '@docusaurus/useGlobalData';

interface GameServer {
  name: string;
  path: string;
}

export default function GameServerList(): ReactNode {
  const docsData = useDocsData('gameServers');
  const pluginData = usePluginData('docusaurus-plugin-content-docs', 'gameServers') as {
    sidebarItems?: Array<{
      type: string;
      label?: string;
      items?: unknown[];
    }>;
  } | undefined;
  
  // Build a map of directory names to category labels from sidebar
  const categoryLabels = new Map<string, string>();
  if (pluginData?.sidebarItems) {
    const extractCategoryLabels = (items: typeof pluginData.sidebarItems) => {
      items?.forEach((item) => {
        if (item.type === 'category' && item.label) {
          // Try to match category to directory name
          // This is a heuristic - category items might have docs that help us match
          const categoryPath = (item as {items?: Array<{id?: string}>}).items?.[0]?.id;
          if (categoryPath) {
            const dirName = categoryPath.split('/')[0];
            if (dirName && dirName !== 'index') {
              categoryLabels.set(dirName, item.label);
            }
          }
        }
        if ((item as {items?: unknown[]}).items) {
          extractCategoryLabels((item as {items: unknown[]}).items as typeof pluginData.sidebarItems);
        }
      });
    };
    extractCategoryLabels(pluginData.sidebarItems);
  }
  
  // Get all docs and filter for game server directories
  const gameServersMap = new Map<string, {name: string; docs: string[]}>();
  
  // First pass: collect all docs by directory
  Object.values(docsData.versions[0].docs).forEach((doc) => {
    // Skip the index page itself
    if (doc.id === 'index' || doc.id === 'index/index') {
      return;
    }
    
    // Extract directory name from path (e.g., "UT2004/Docker" -> "UT2004")
    const pathParts = doc.id.split('/');
    if (pathParts.length > 1) {
      const dirName = pathParts[0];
      
      if (!gameServersMap.has(dirName)) {
        // Use category label if available, otherwise format directory name nicely
        let displayName = categoryLabels.get(dirName);
        
        if (!displayName) {
          // Format directory name nicely (e.g., "UT2004" -> "UT2004", "GameServer" -> "Game Server")
          displayName = dirName
            .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
            .replace(/\d+/g, ' $& ') // Add space around numbers
            .replace(/\s+/g, ' ')
            .trim();
          
          // If it's all caps or starts with uppercase, keep it as is (e.g., "UT2004")
          if (dirName === dirName.toUpperCase() || /^[A-Z]/.test(dirName)) {
            displayName = dirName;
          }
        }
        
        gameServersMap.set(dirName, {
          name: displayName,
          docs: [],
        });
      }
      
      gameServersMap.get(dirName)!.docs.push(doc.id);
    }
  });
  
  // Find the best entry point for each game server
  const gameServers: GameServer[] = Array.from(gameServersMap.entries())
    .map(([dirName, data]) => {
      // Prefer Overview, then index, then first doc alphabetically
      const overviewDoc = data.docs.find(doc => 
        doc.toLowerCase().includes('overview') || 
        doc.toLowerCase().endsWith('/overview')
      );
      const indexDoc = data.docs.find(doc => 
        doc.toLowerCase().includes('index') || 
        doc.toLowerCase().endsWith('/index')
      );
      const entryDoc = overviewDoc || indexDoc || data.docs.sort()[0];
      
      return {
        name: data.name,
        path: `/GameServers/${entryDoc}`,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  
  if (gameServers.length === 0) {
    return (
      <p>No game servers are currently documented.</p>
    );
  }
  
  return (
    <ul>
      {gameServers.map((server) => (
        <li key={server.path}>
          <Link to={server.path}>{server.name}</Link>
        </li>
      ))}
    </ul>
  );
}
