import { defineEventHandler, setHeader } from 'nitro/h3';
import { buildGraphFeed } from './_feeds';

export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=3600');
  return buildGraphFeed();
});
