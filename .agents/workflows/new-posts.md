---
description: create new post
---

Add a script to create a new blog post.

The command should be:

npm run new-post "post-title"

It should automatically:

1. Create a markdown file inside content/posts
2. Generate a slug from the title
3. Add frontmatter template:

---
title:
date:
tags:
description:
---

4. Open the file path for editing.