# Corporate DNA CMS — Complete User Manual

**A step-by-step guide for everyone who edits the website — no technical background needed.**

This manual teaches you how to run the Corporate DNA website content on your own,
without a developer. It covers **everything both roles do**:

- **Editors** — create and publish content (cases, solutions, people, insights, and more).
- **Admins** — everything an editor does, **plus** manage users, languages, and the audit log.

Sections that only admins can see are marked with **🔑 Admin only**. If you are an editor,
you can skip those — you will not see those screens.

> ### How to read this manual
> Follow it in order the first time. After that, use the **Table of contents** to jump to
> what you need. Every screen in the app is shown with a **screenshot placeholder** like this:
>
> > 🖼️ **SCREENSHOT — example:** A short description of exactly what to capture.
>
> These are slots for real pictures. A teammate with access can take each screenshot and
> paste it in place of the placeholder — the caption tells them precisely what screen to grab.

---

## Table of contents

1. [Before you start: key ideas in plain language](#1-before-you-start-key-ideas-in-plain-language)
2. [Signing in](#2-signing-in)
3. [Your first sign-in (new accounts)](#3-your-first-sign-in-new-accounts)
4. [If you get locked out](#4-if-you-get-locked-out)
5. [Getting around the CMS](#5-getting-around-the-cms)
6. [The content types, explained](#6-the-content-types-explained)
7. [The core workflow: create, save, preview, publish](#7-the-core-workflow-create-save-preview-publish)
8. [Understanding every field type](#8-understanding-every-field-type)
9. [Writing with the rich-text editor](#9-writing-with-the-rich-text-editor)
10. [Working with images and files (Media)](#10-working-with-images-and-files-media)
11. [Version history: undo and restore](#11-version-history-undo-and-restore)
12. [Deleting content](#12-deleting-content)
13. [Field reference for each content type](#13-field-reference-for-each-content-type)
14. [Ordering People (drag and drop)](#14-ordering-people-drag-and-drop)
15. [Legal pages](#15-legal-pages)
16. [Working in more than one language](#16-working-in-more-than-one-language)
17. [Contacts: the contact-form inbox](#17-contacts-the-contact-form-inbox)
18. [🔑 Admin only: Managing users](#18--admin-only-managing-users)
19. [🔑 Admin only: The audit log](#19--admin-only-the-audit-log)
20. [🔑 Admin only: Managing languages](#20--admin-only-managing-languages)
21. [Troubleshooting & FAQ](#21-troubleshooting--faq)
22. [Golden rules (one-page cheat sheet)](#22-golden-rules-one-page-cheat-sheet)

---

## 1. Before you start: key ideas in plain language

Read this once. These five ideas make everything else obvious.

| Idea | What it means |
|------|---------------|
| **Draft vs. Published** | A **draft** is your private work-in-progress. Nobody visiting the public website can see it. When you **publish**, it goes live for the world. You can always go back to a draft by **unpublishing**. |
| **Two roles** | **Editor** = writes and publishes content. **Admin** = everything an editor does, plus manages people's accounts and settings. |
| **Two-step login (MFA)** | Every time you sign in, you type your password **and** a 6-digit code from an app on your phone. This is required for everyone — it keeps the website safe. |
| **Everything is saved as versions** | Every save is kept in history. If you make a mistake, you can **restore** an older version. Nothing is ever truly lost. |
| **The website updates automatically** | When you publish, the public website refreshes on its own within moments. You do **not** need to tell anyone or "push" anything. |

> 🖼️ **SCREENSHOT — big-picture:** *(Optional)* A simple diagram or the dashboard, to open the manual with a friendly visual.

---

## 2. Signing in

Once your account exists (see [Section 3](#3-your-first-sign-in-new-accounts) if this is your very first time), signing in takes two quick steps.

**Step 1 — Email and password**

1. Open the CMS address in your browser (your admin will give you the link).
2. Type your **Email** and **Password**.
3. Click **Continue**.

> 🖼️ **SCREENSHOT — login-step1:** The "CMS sign in" screen showing the Email field, Password field, the **Continue** button, and the "Forgot your password?" link below it.

**Step 2 — Your 6-digit code**

4. The screen now asks for a **Verification code**.
5. Open your authenticator app on your phone (Google Authenticator, 1Password, Microsoft Authenticator, etc.) and read the current 6-digit code for "Corporate DNA".
6. Type the 6 digits and click **Verify**.

> 🖼️ **SCREENSHOT — login-step2:** The verification screen with the "Enter the 6-digit code from your authenticator app" hint, the code box, and the **Verify** button.

You are now on the **Dashboard**. 🎉

> ⚠️ **Codes are shared across your whole office network.** There is a limit of **15 code attempts per hour for the entire network**, not per person. If you see a "rate-limited" message, **wait** — retrying makes it worse for everyone in the office.

---

## 3. Your first sign-in (new accounts)

New accounts are **never** created by handing someone a password. Instead, an admin
sends you an **email invitation**, and you set up everything yourself. No one — not even
an admin — ever knows or sees your password or your codes.

Here is the whole first-time flow:

**A. Open the invitation email**

1. Find the invitation email in your inbox and click its link.

> 🖼️ **SCREENSHOT — invite-email:** The invitation email with the "accept invite / set password" button highlighted.

**B. Choose your own password**

2. Pick a strong password and confirm it. This becomes yours alone.

> 🖼️ **SCREENSHOT — set-password:** The "set your password" screen.

**C. Set up your authenticator app (one-time)**

3. You land on **"Set up your second factor"**. A **QR code** appears.
4. On your phone, open your authenticator app, choose "add / scan", and point the camera at the QR code.
   - **Can't scan?** Click **"Can't scan? Enter a key instead"** and type the setup key shown into your app by hand.
5. Your app now shows a 6-digit code for "Corporate DNA". Type it into **Verification code**.
6. Click **Finish setup**.

> 🖼️ **SCREENSHOT — mfa-enrol:** The "Set up your second factor" screen showing the QR code, the "Can't scan? Enter a key instead" link, the code box, and the **Finish setup** button.

That's it — you're in, and future sign-ins only need your password + a fresh code.

> 💡 **Tip:** Until you finish this one-time setup, the CMS stays locked. This is normal and by design.

---

## 4. If you get locked out

| Problem | What to do |
|---------|------------|
| **Forgot your password** | On the sign-in screen, click **"Forgot your password?"**. A reset link arrives by email; it works once and then expires. **You will still need your 6-digit code** — resetting a password never skips the second step. |
| **Lost or replaced your phone** (no authenticator) | Ask an **admin** to **Reset** your second factor (see [Section 18](#18--admin-only-managing-users)). Your next sign-in will walk you through scanning a fresh QR code. |
| **"Rate-limited" message** | Too many code attempts across the office network. **Wait** (up to an hour) instead of retrying. |
| **Your account was disabled** | An admin has turned your account off. Contact an admin to re-enable it. |

> 🖼️ **SCREENSHOT — recover:** The password-recovery screen reached from the "Forgot your password?" link.

---

## 5. Getting around the CMS

Every screen has the same **left-hand menu** (navigation). Your email address shows at the
bottom or top of it, so you always know which account you're using.

The menu items are:

| Menu item | What's inside | Who sees it |
|-----------|---------------|-------------|
| **Dashboard** | The home screen with a card for each content type. | Everyone |
| **Case studies** | Client success stories. | Everyone |
| **Solutions** | Your service/solution pages. | Everyone |
| **People** | Team member profiles. | Everyone |
| **Regions** | The regions shown on the home-page world map. | Everyone |
| **Insights** | Articles / blog posts. | Everyone |
| **Legal pages** | Privacy, Cookies, Terms. | Everyone |
| **Media** | The library of uploaded images and files. | Everyone |
| **Contacts** | Messages sent through the site's contact form. | Everyone |
| **Languages** | Add and manage site languages. | **🔑 Admin only** |
| **Users & audit** | Manage accounts and view the activity log. | **🔑 Admin only** |

> 🖼️ **SCREENSHOT — nav:** The full left navigation menu, ideally as an **admin** so all items (including Languages and Users & audit) are visible, with your email shown.

**The Dashboard** shows a card for each main content type. Click any card to jump straight
into that type's list.

> 🖼️ **SCREENSHOT — dashboard:** The Dashboard with its grid of content cards (Case studies, Solutions, People, Regions, Insights, Legal pages).

---

## 6. The content types, explained

There are two shapes of content.

**Collections** — you can have *many* of these:

- **Case studies** — a client challenge, your approach, the result, a quote, cover/brand imagery, and optional video. Case studies also carry **facets** (industry / service / region / outcome) that power the filterable library on the public site.
- **Solutions** — the services you offer.
- **People** — team profiles (name, role, bio, photo, social links). These can be **re-ordered by hand**.
- **Regions** — the regions that appear on the interactive **world map on the home page** (this is *not* the site's "Offices" section).
- **Insights** — articles/blog posts, with author, cover image, and an optional YouTube video.

**Single pages (singletons)** — there is *exactly one* of each:

- The **Legal pages**: **Privacy**, **Cookies**, and **Terms**.
- You edit the single entry — you never create new ones — and you reach them from **Legal pages** in the menu.

---

## 7. The core workflow: create, save, preview, publish

**This single workflow is the same for every content type.** Learn it once and you can edit anything.

### Step 1 — Open a type and start a new entry

1. Click the type in the left menu (e.g. **Insights**).
2. You'll see a list of existing entries. Click the **New** button (top right).
   - If the list is empty, you'll see "Nothing here yet" with a **New** button in the middle.

> 🖼️ **SCREENSHOT — list:** An Insights (or Case studies) list showing the table columns — **Title, Languages, Updated, Actions** — and the **New** button top-right.

### Step 2 — (If multiple languages exist) choose a language

3. On a brand-new entry, a **Language** dropdown may appear at the top. Pick the language you're writing in (usually the default). You only see this when more than one language is set up.

### Step 3 — Fill in the fields

4. Fill in the fields. Required fields are marked with a red asterisk **\***.
   - See [Section 8](#8-understanding-every-field-type) for exactly how each kind of field works.
   - A small **status badge** near the title shows **Draft** or **Published**, and "**Unsaved changes**" appears while you're typing.

> 🖼️ **SCREENSHOT — editor:** A content edit screen showing the title heading, the status badge, several fields (including a required one with a red \*), and the sticky action bar at the bottom with **Save draft** and **Publish**.

> 💾 **Auto-save:** The CMS quietly saves your draft about **10 seconds** after you stop typing, and whenever you click out of a field. You'll still want to click **Save draft** yourself before leaving, just to be safe.

### Step 4 — Save your draft

5. Click **Save draft** (bottom bar). This stores your work. **It is not on the public website yet** — it's private.
6. If anything required is missing, a red summary appears listing what to fix, with links straight to each field.

### Step 5 — Preview (see it before it's live)

7. Click **Preview** (top right). A new tab opens showing the entry **exactly as it will appear on the website**, including your unpublished draft. This link is private.
   - *Note:* some types (like People and Regions) have no standalone preview page, so the Preview button won't appear for them.

### Step 6 — Publish (make it live)

8. When you're happy, click **Publish**. Your content goes live on the public website within moments.
   - Publishing is **blocked** if a required field is empty or a chosen image was deleted. The error message names exactly what to fix (e.g. *"Can't publish. Please fix: Title, Body."*).

### After publishing: making further edits

Once something is published and you edit it again:

- You'll see an **⚠ Unpublished changes** badge and a note: *"the site still shows the last published version."*
- Your edits are saved privately as a draft. When ready, click **Publish changes** to push them live.
- A green **● Live** badge means what you see is exactly what the public sees.

To take something **offline**, click **Unpublish** — it returns to draft and disappears from the public site (your content is kept, not deleted).

> 🖼️ **SCREENSHOT — publish-states:** The bottom action bar of a published entry with pending edits — showing the **⚠ Unpublished changes** badge, **Save draft**, **Publish changes**, and **Unpublish** buttons, plus the amber "You have unpublished changes…" note.

---

## 8. Understanding every field type

The edit form is built from a handful of field types. Here's how to use each one.

| Field type | Looks like | How to use it |
|------------|-----------|---------------|
| **Text** | A single-line box. | Type a short line (a title, a name, a role). |
| **Text area** | A bigger multi-line box. | Type a longer plain paragraph (e.g. a quote). |
| **Rich text** | A box with a formatting toolbar. | Format text, add lists, links, images and YouTube videos. See [Section 9](#9-writing-with-the-rich-text-editor). |
| **URL** | A single-line box. | Paste a full web address, e.g. `https://…`. |
| **Email** | A single-line box. | Type an email address. |
| **Date** | A date picker. | Click and choose a date from the calendar. |
| **Media** | A thumbnail + **Choose media** button. | Pick or upload an image/file. See [Section 10](#10-working-with-images-and-files-media). |
| **List (one per line)** | A multi-line box. | Type **one item per line** (e.g. tags, address lines). Each line becomes a separate item. |
| **Facets** (cases only) | Four small boxes: industry / service / region / outcome. | Type **comma-separated** values in each box, e.g. `Finance, Retail`. These power the site's filters. |
| **JSON** (advanced) | A code-style box. | Used for complex, repeating content. Most editors never meet one. Follow the on-screen hint for the exact shape, and keep the brackets/commas correct. If it's wrong, you'll get *"Invalid JSON — check for a trailing comma or unquoted key."* |

> 💡 **About JSON fields:** These are the only "techy" fields, and most editors never meet one. They hold a structured list — a repeating set of items, each with its own sub-fields, for example:
> ```json
> [
>   { "name": "Item name", "year": "2025", "logoMediaId": "" }
> ]
> ```
> Keep the shape shown in the field's label, change only the values, and preview before publishing. When in doubt, ask an admin.

> 🖼️ **SCREENSHOT — field-types:** A form area that includes a text field, a rich-text field, a media field, and the four facet boxes, so all common field types are visible at once (a Case study edit screen works well).

---

## 9. Writing with the rich-text editor

Rich-text fields (like a Case's **Text**, an Insight's **Body**, a Person's **Bio**) have a
toolbar for formatting.

**The toolbar buttons, left to right:**

| Button | What it does |
|--------|--------------|
| **Heading** (H2 / H3 / Normal) | Turn a line into a section heading, or back to normal text. |
| **Bold / Italic / Underline** | Emphasise selected text. |
| **Ordered list / Bullet list** | Numbered or bulleted lists. |
| **Blockquote** | Indent a quotation. |
| **Link** | Turn selected text into a clickable link. |
| **Image** | Upload a picture **into** the text (see below). |
| **Video** | Embed a **YouTube** video (see below). |
| **Clean** | Remove formatting from the selected text. |

> 🖼️ **SCREENSHOT — richtext:** A rich-text field with its toolbar clearly visible, ideally with a heading, a bullet list, and an embedded image inside the text area.

**Adding an image inside text**

1. Click the **image** button in the toolbar.
2. Choose a file from your computer. It uploads automatically and appears in the text.
   - Images are uploaded properly to the media system — you never paste raw images.

**Adding a YouTube video inside text**

1. Click the **video** button.
2. Paste a **YouTube** URL when asked (watch, youtu.be, embed, or shorts links all work).
3. Only YouTube links are accepted — anything else is rejected with a message.

**Removing an image or video you added**

- Hover your mouse over the image/video inside the editor. A red **×** button appears in its corner — click it to remove that image or video.

> ⚠️ **Pasting always removes formatting.** When you paste text (from Word, a web page, an email…), it comes in as **plain text** with no colours, fonts, or hidden styles. This is intentional — it keeps the site looking consistent. Re-apply bold, headings, etc. with the toolbar after pasting.

---

## 10. Working with images and files (Media)

Every image on the site lives in the **Media library**. You can add images two ways.

### A) Straight from a field (most common)

When a field is for an image (e.g. **Cover image**, **Photo**, **Brand logo**):

1. Click **Choose media**.
2. A **Media library** window opens.
3. Either click an existing image, **or** click **Upload** to add a new one from your computer.
4. The window closes and your image is attached. To swap it, click **Change**; to remove it, click **Clear**.

> 🖼️ **SCREENSHOT — media-picker:** The "Media library" pop-up (opened from a **Choose media** button) showing the **Upload** button at the top and a grid of image thumbnails, with one selected (highlighted border).

### B) From the Media menu (managing the whole library)

Click **Media** in the left menu to see everything uploaded.

1. Click **Upload** (top right) to add a new file.
2. Each item shows its thumbnail, filename, and size. Click a thumbnail to open the full file.
3. Click **Delete** under an item to remove it.

> 🖼️ **SCREENSHOT — media-library:** The Media page showing the **Upload** button and the grid of uploaded files, each with filename, size, and a **Delete** button.

> ⚠️ **Deleting media is permanent.** It removes the file for good. If any content still uses that image, it will show a **broken image**. Make sure nothing needs a file before deleting it.

**Rules to remember about media:**

- **Videos are not uploaded here.** For video, paste a **YouTube URL** into the video field instead.
- Some fields have stricter rules. For example, a **Brand logo** must be a **transparent PNG up to 1024×1024**. If a file breaks a rule, the upload is rejected with a message telling you why.
- Always add a clear, descriptive filename — it helps everyone find images later.

---

## 11. Version history: undo and restore

Every time you save, the CMS keeps a snapshot. You can go back to any earlier one.

1. On an entry's edit screen, click **Version history** (top right).
2. A panel lists every version with its **date** and **author**.
3. Click **Restore** on any earlier version to bring its content back.

> 🖼️ **SCREENSHOT — versions:** The Version history panel open over an edit screen, listing several versions with dates/authors and a **Restore** button on each.

> 💡 **Restoring is safe.** A restore is itself saved as a new version, so you never lose anything — you can even "undo the undo" by restoring again. If you had unsaved edits on screen, they're saved first before the restore, so nothing is thrown away.

---

## 12. Deleting content

To delete a whole entry:

1. Go to the type's list.
2. In the **Actions** column of the row, click **Delete**.
3. A confirmation box explains what will happen. Confirm to proceed.

> 🖼️ **SCREENSHOT — delete-confirm:** The delete confirmation dialog ("Delete …? This removes the entry and all of its language versions from the site.") with its **Delete** and cancel buttons.

> ⚠️ **Delete removes every language version** of that entry from the site. If you only want to hide something temporarily, **Unpublish** it instead (Section 7) — that keeps it and lets you bring it back.

---

## 13. Field reference for each content type

Use this as a quick lookup. **Required fields are marked ✅** — the entry can't be published without them.

### Case studies
| Field | Type | Required | Notes |
|-------|------|:---:|-------|
| Tags | List (one per line) | | Keywords for the case. |
| Page title | Text | ✅ | The case title. |
| Quote | Text area | | A client quote. |
| Quoter | Text | | Who said the quote. |
| Interview video (URL) | URL | | Video that autoplays without sound. |
| YouTube video (URL) | URL | | watch / youtu.be / embed / shorts link. |
| Brand colour | Text | | 6-digit hex, e.g. `#1a2b3c`. Blank = default. |
| Brand logo | Media | | Transparent PNG, up to 1024×1024. |
| Introduction | Rich text | | |
| Text | Rich text | | The main body. |
| *Facets* | Facets | | industry / service / region / outcome — power the site filters. |

### Solutions
| Field | Type | Required | Notes |
|-------|------|:---:|-------|
| Title | Text | ✅ | |
| Banner background image | Media | | Background image for the banner. |
| Problem statement | Rich text | ✅ | |
| Body | Rich text | | |

### People
| Field | Type | Required | Notes |
|-------|------|:---:|-------|
| Name | Text | ✅ | |
| Role | Text | ✅ | Job title. |
| Bio | Rich text | ✅ | |
| Photo | Media | | Profile photo. |
| Region slug | Text | | Links the person to a region. |
| LinkedIn / Instagram / Facebook / X | URL | | Social profile links. |
| Email | Email | | |

### Regions
*Each region is a point on the home-page world map — add one per region you want shown there.*

| Field | Type | Required | Notes |
|-------|------|:---:|-------|
| Name | Text | ✅ | |
| City | Text | ✅ | |
| Country | Text | | |
| Summary | Rich text | | |
| Address lines | List (one per line) | | One address line per line. |

### Insights
| Field | Type | Required | Notes |
|-------|------|:---:|-------|
| Tags | List (one per line) | | |
| Title | Text | ✅ | |
| Author | Text | | Shown as "By …" on the insight. |
| Excerpt | Rich text | | Short summary. |
| Body | Rich text | ✅ | The article. |
| Cover image | Media | | |
| YouTube video (URL) | URL | | |
| Published date | Date | | |

---

## 14. Ordering People (drag and drop)

The **People** list is special: the order you set here is the order visitors see on the site.

1. Open **People**.
2. Grab a row and **drag it up or down** to reorder.
3. The new order saves automatically.

> 🖼️ **SCREENSHOT — people-order:** The People list in its drag-and-drop form, ideally mid-drag with a row lifted.

---

## 15. Legal pages

The **Legal pages** are "single" pages — each exists only **once**, so you edit that one entry and never create new ones.

1. Click **Legal pages** in the menu.
2. You'll see three cards: **Privacy**, **Cookies**, and **Terms**.
3. Click one to edit it. Each has a **Title** ✅ and a **Body** ✅ (rich text).

They use the same **Save draft → Preview → Publish** workflow as everything else.

> 🖼️ **SCREENSHOT — legal-pages:** The "Legal pages" screen with the Privacy, Cookies, and Terms cards.

---

## 16. Working in more than one language

The site can hold the same content in several languages. Each entry is one language;
"translations" are linked copies in other languages.

**Where you see languages**

- In a **list**, the **Languages** column shows a chip per language, with a **Draft/Published** badge. A dashed **+ [Language]** chip means that translation doesn't exist yet — click it to create it.
- On an **edit screen**, a **Languages** bar at the top shows every language. The current one is marked **(current)**; click another to switch to it, or click a dashed language to create that translation.

> 🖼️ **SCREENSHOT — translations:** An edit screen's top "Languages" bar, showing the current language marked "(current)", one other existing language, and a dashed "+ language" chip to create a new translation.

**Creating a translation**

1. Click the dashed **+ [Language]** chip (in the list or on the edit screen).
2. A new entry opens in that language, **pre-filled from the source** — you translate over the existing text.
3. Save, preview, and publish it just like any other entry.

> 💡 If a language isn't offered, an admin needs to add it first — see [Section 20](#20--admin-only-managing-languages).

---

## 17. Contacts: the contact-form inbox

When someone fills in the **contact form on the public marketing site**, their message
lands here. Everyone (editors and admins) can read these messages — think of it as a
shared inbox.

1. Click **Contacts** in the left menu.
2. You'll see a table of every submission, newest first, with a count of messages at the top.

| Column | What it shows |
|--------|---------------|
| **Name** | Who sent the message. |
| **Email** | Their email — **click it to reply** straight from your email app. |
| **Organisation** | Their company, if they gave one (otherwise "—"). |
| **Received** | The date and time it arrived. |

> 🖼️ **SCREENSHOT — contacts:** The "Contacts" screen showing the message count at the top and the table (Name, Email, Organisation, Received) with **View** and **Delete** buttons on each row.

**Reading a full message**

Click **View** on a row to expand it. You'll see the full **Message**, plus technical
details: **Source**, **Referer**, and **User agent** (where the message came from). Click
**Hide** to collapse it again.

> 🖼️ **SCREENSHOT — contacts-expanded:** A contact row expanded to show the full Message, Source, Referer, and User agent details.

**Replying and clearing messages**

- **To reply:** click the person's **email address** — your email app opens with a new message to them. (Replies happen in your own email, not inside the CMS.)
- **To clear one you've handled:** click **Delete** and confirm.

> ⚠️ **Delete is permanent.** A deleted contact submission cannot be recovered. Only delete messages you've already dealt with.

> 💡 Contacts are **read-only records** — you can't create or edit them here. You only read them, reply by email, and delete the ones you're done with. If the list is empty you'll see "No contact submissions yet."

---

## 18. 🔑 Admin only: Managing users

Only **admins** see **Users & audit** in the menu. This is where you invite teammates and
control access.

> 🖼️ **SCREENSHOT — users:** The "Users & audit" screen showing the **Invite user** form at the top and the users table (Email, Role, Status, Second factor, Delete) below.

### Inviting a new user

1. In the **Invite user** box, type their **Email**.
2. Choose a **Role** — **Editor** or **Admin**.
3. Click **Send invitation**.

They receive an email, set their **own** password, and set up their **own** authenticator app
on first sign-in. **You never handle their password or codes** — there's nothing to send them
separately.

### Changing a user's role or access

In the users table, each row has dropdowns and buttons:

| Column | What it does |
|--------|--------------|
| **Role** | Switch between **Editor** and **Admin**. You'll be asked to confirm — admins can manage users and see the audit log. |
| **Status** | **Active** (normal), **Invited** (hasn't finished setup), or **Disabled**. Disabling signs the person out and blocks them from signing in until re-enabled. |
| **Second factor → Reset** | Use this when someone loses their phone. Their old authenticator stops working immediately and they set up a new one on next sign-in. |
| **Delete** | Permanently removes the account. Their authored content and the audit trail are **kept**, with the author left blank. |

> 🖼️ **SCREENSHOT — user-actions:** A close-up of one user row showing the Role dropdown, Status dropdown, the **Reset** button, and the **Delete** button. Optionally include a confirmation dialog (e.g. "Reset the second factor for …?").

> 🛡️ **Safety rule you can't override:** The system **refuses** to demote, disable, or delete the **last active admin**. This prevents anyone from ever locking the whole team out. **Always keep at least two admins.**

---

## 19. 🔑 Admin only: The audit log

At the bottom of **Users & audit** is the **Recent audit** log — an automatic, permanent record
of every important action (who did what, and when).

1. Each line shows the **time**, the **action**, the **target**, and **who** did it.
2. Click a line to **expand** it and see full details.
3. Use **Previous / Next** to page through history.

> 🖼️ **SCREENSHOT — audit:** The "Recent audit" list with one entry expanded to show its When / Action / Actor / Target / Details, plus the Previous/Next pager.

> 💡 The audit log can't be edited or erased, and it survives even if a user is deleted (their email is kept as a snapshot). It's there to answer "who changed this?" with certainty.

---

## 20. 🔑 Admin only: Managing languages

Only admins see **Languages** in the menu. This is where you control which languages editors
can write in.

> 🖼️ **SCREENSHOT — languages:** The Languages screen showing the **Add a language** form and the table (Code, Name, Default, Status, Actions).

### Adding a language

1. In **Add a language**, type a **Code** (e.g. `pt-BR`, `es`, `fr`) and a **Name** (e.g. `Português (Brasil)`).
2. Click **Add language**.

### Managing existing languages

In the table:

| Column | What it does |
|--------|--------------|
| **Name** | Click the name to edit it, then click away to save the rename. |
| **Default** | The default language is the fallback shown when a translation is missing. Click **Set default** on another language to change it (it must be enabled first). |
| **Status** | Click **Enabled / Disabled** to toggle. Disabled languages disappear from editors' choices but keep their content. |
| **Delete** | Removes a language from the registry. **Only languages with no content can be deleted** — otherwise **disable** it instead. |

> 💡 Adding or enabling a language makes it appear immediately for editors — no rebuild or developer needed.

---

## 21. Troubleshooting & FAQ

**"I published but the website hasn't changed."**
Give it a moment and refresh the public page. Publishing triggers an automatic update. If it
still doesn't show after a few minutes, tell an admin (it may be a webhook/config issue, not
something you did).

**"I can't publish — there's a red error."**
A required field is empty, or an image you chose was deleted. The message names exactly what to
fix. Correct those fields and click **Publish** again.

**"It says 'Someone else saved this entry while you were editing.'"**
Two people edited the same entry at once. Reload the page to get their changes, then re-apply
yours. To avoid this, coordinate who edits what.

**"My formatting disappeared when I pasted."**
That's on purpose — pasting always drops formatting. Re-apply bold, headings, and lists with
the toolbar.

**"The Preview button isn't there."**
Some types (People, Regions) have no standalone public page, so there's nothing to preview.

**"I don't see Users & audit or Languages."**
Those are **admin-only**. If you need something there, ask an admin.

**"I lost my phone / can't get a code."**
Ask an admin to **Reset** your second factor. You'll set up a new authenticator on next sign-in.

**"Rate-limited when entering my code."**
The limit is shared across the office network (15 attempts/hour). Wait rather than retrying.

**"I deleted something by mistake."**
For a whole entry: contact an admin — deletion is hard to reverse. For content *inside* an entry,
use **Version history → Restore**. For media, a deleted file is gone; you'll need to re-upload it.

---

## 22. Golden rules (one-page cheat sheet)

- 🔑 **Sign in = password + 6-digit code.** Keep your authenticator app safe.
- 📝 **Draft is private. Publish makes it live.** Preview before you publish.
- ✅ **Red \* = required.** You can't publish until required fields are filled.
- 🖼️ **Add images via the field or Media library.** Videos = paste a YouTube link, never upload.
- 🧹 **Pasting removes formatting** — re-apply it with the toolbar.
- 🕓 **Every save is a version.** Made a mistake? **Version history → Restore.**
- 🗑️ **Delete is forever and removes all languages.** To hide temporarily, **Unpublish** instead.
- 🌍 **Translations start pre-filled from the source** — translate over the text.
- 👥 **Admins:** always keep **at least two admins**; the system won't let you remove the last one.
- ❓ **Unsure?** Preview first, and ask an admin before deleting anything.

---

*You're ready. Sign in, open a type, click **New**, and try the full **Save draft → Preview → Publish** loop on a test entry — it's the safest way to learn.*
