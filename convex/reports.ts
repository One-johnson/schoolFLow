import { query } from './_generated/server';

export const getData = query({
  args: {},
  handler: async () => {
    // Return empty array - in production this would aggregate from actual data
    return [];
  },
});
