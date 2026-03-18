import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const sidebars: SidebarsConfig = {
  interposerSidebar: [
    'Overview',
    {
      type: 'category',
      label: 'Installation',
      link: {type: 'generated-index', title: 'Installation'},
      items: [
        {type: 'doc', id: 'ReleasePackages'},
        {type: 'doc', id: 'GettingStarted'},
      ],
    },
    {
      type: 'category',
      label: 'Features',
      link: {type: 'generated-index', title: 'Features'},
      items: [
        {type: 'doc', id: 'Logging'},
        {type: 'doc', id: 'FileRedirection'},
        {type: 'doc', id: 'RegistryEmulation'},
        {type: 'doc', id: 'FastDL'},
        {type: 'doc', id: 'BorderlessFullscreen'},
        {type: 'doc', id: 'PlayerIdentity'},
      ],
    },
  ]
};

export default sidebars;
