# Hackmate

[![Hackmate on Peerlist](https://peerlist.io/api/v1/projects/embed/PRJHJKNR7KLEGQGOG1AQJJMBRREMRN?showUpvote=false&theme=light)](https://peerlist.io/dfordp/project/hackmate)
[![Hackmate on Product Hunt](https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1018821&theme=light)](https://www.producthunt.com/products/hackmate?utm_source=badge-featured&utm_medium=badge&utm_source=badge-hackmate)


**Live project:** [hackmate.app](https://hackmate.app/)
---

## Project Owner

**dpji:** [dpji](https://github.com/dpji)


## Overview

Hackmate is a swipe-based matchmaking platform designed for founders and builders to meet potential co-founders, collaborators, and indie hackers.

Instead of social media profiles and endless bios, Hackmate focuses on skills, intent, and mutual interest. Users create lightweight profiles, swipe to express interest, and get matched in real time if there is mutual alignment.

The app was built to make collaboration faster and more intentional for startup ecosystems, hackathons, and builder communities.

---

## How It Works

1. Users create a profile with their skills, experience, and goals.
2. The app shows other profiles that can be swiped right (interested) or left (skip).
3. When two users swipe right on each other, they instantly appear in a shared match queue.
4. Matched users can view details and connect immediately.

This approach removes friction from networking by focusing only on aligned intent and relevant skills.

---

## Key Features

* **Swipe-based discovery**: Browse and evaluate potential collaborators quickly.
* **Real-time matches**: Matches appear instantly through a Redis-backed caching layer.
* **Mutual-only visibility**: Users only see interest if it is reciprocated, reducing pressure.
* **Skill-focused profiles**: Profiles highlight what users can do and what they have built.
* **Low-latency infrastructure**: Redis and WebSockets ensure fast responses for swipes and matches.

---

## Technology Stack

**Frontend**

* Next.js for the web application
* Tailwind CSS for styling

**Backend**

* PostgreSQL for structured data
* Redis for real-time caching and match detection

**Infrastructure**

* Vercel for hosting
* Redis running locally via Docker or in the cloud (Upstash, Aiven, etc.)

---

## Redis Store Design

| Purpose       | Type | Key Format          | Example                          |
| ------------- | ---- | ------------------- | -------------------------------- |
| Likes Given   | SET  | `likes:<user_id>`   | Used to prevent duplicate swipes |
| Match Queue   | LIST | `matches:<user_id>` | Stores mutual matches            |
| User Profiles | HASH | `user:<user_id>`    | Caches basic profile information |

Other matching logic, such as filtering, exclusions, and scoring, is handled through the backend services.

---

## Local Development Setup

Clone the repository:

```bash
git clone https://github.com/dfordp/hackmate-rework.git
cd hackmate
```

Install dependencies:

```bash
npm install
```

Run Redis locally or connect to a cloud provider:

```bash
docker run -p 6379:6379 redis
```

Start the development server:

```bash
npm run dev
```

Environment configuration:

```env
REDIS_URL=redis://localhost:6379
```

---

## Future Development

Planned features include:

* Role and interest-based filtering (e.g., designer, product, engineering)
* Matching based on timezone and geography
* Project pitch cards and lightweight portfolios
* Improved match feed and conversation prompts


Here’s a **`CONTRIBUTING.md`** file written in the same style as your `README.md` (no emojis, no AI buzzwords, no double dashes, and keeping the passion-project tone):


# Contributing to Hackmate

Thank you for your interest in contributing. Hackmate started as a side project to explore whether swipe-style discovery could improve how founders and builders connect. Every contribution, whether big or small, helps move the project forward.

For Discussions Join : [Discord](https://discord.gg/E8MaEyD7ws)

## How to Get Started

1. **Fork the repository** and clone your fork locally.
2. **Set up the environment** following the steps in the README.
3. Create a new branch for your work with a descriptive name.
4. Make your changes in small, focused commits.
5. Run the linter and tests before pushing.
6. Submit a pull request against the `main` branch.


## Reporting Issues

If you encounter a bug or want to suggest an improvement, open an issue. Please include:

* A clear title and description.
* Steps to reproduce the problem (if reporting a bug).
* Expected behavior versus actual behavior.
* Screenshots, logs, or environment details if relevant.

For sensitive security-related issues, please do not file a public issue. Instead, reach out directly to the maintainer.

## Suggesting Features

Before starting work on a new feature, open an issue to discuss the idea. This helps ensure efforts are aligned with the direction of the project. Describe:

* The problem you are solving.
* The proposed solution.
* Any impact on the existing data model or flows.


## Code Guidelines

* Follow existing patterns in the codebase.
* Use TypeScript where possible to keep types clear and reduce errors.
* Keep functions small and focused.


## Development Environment

* **Frontend:** Next.js with Tailwind CSS
* **Backend:** Prisma with PostgreSQL
* **Real-time:** Redis for caching and match detection
* **Auth:** Clerk
* **Hosting:** Vercel

Environment variables are required for Redis and Postgres (see README).


## Pull Requests

When opening a pull request:

* Reference any related issue.
* Summarize the change in the PR description.
* Add migration or setup notes if needed.
* Keep PRs small and focused for easier review.


## Community and Communication

The project also has a community Discord server where contributors share ideas, feedback, and roadmaps. Once you make your first contribution, feel free to join and introduce yourself.



## License

MIT License. Hackmate is open for experimentation, forking, and extension.
