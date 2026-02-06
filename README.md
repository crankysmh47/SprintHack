

# The Bayesian Trust Graph: A Sybil-Resistant Rumor Management System

## Overview

Our approach outlines the architecture for a decentralized rumor management system designed to solve two fundamental problems:

1.  **The Sybil Attack Problem:** Preventing a coordinated group of liars (bots) from overwhelming the system without using centralized identity verification.
2.  **The Tyranny of the Majority:** Ensuring that popular false rumors do not win simply because more people believe them.

The system utilizes a combination of **Graph Theory** (for identity/trust) and **Information Theory** (for truth extraction).

---

## The Architecture

### 1. Sybil Resistance: The "TrustRank" Graph

Since identities (like passports) are not collected, the system relies on **relationships**.

*   **The Structure:** A directional graph where Users are **Nodes** and Trust is an **Edge**.
*   **The Logic:** An attacker can create 1,000 bots, but those bots will likely only trust each other. They will have very few edges connecting them to the "honest" part of the network.
*   **The Weighting (Flow-Based Voting):**
    *   We do not use "One Person, One Vote."
    *   Voting power is determined by **Personalized PageRank**.
    *   If Node A votes, their vote weight depends on how close they are in the trust graph to other reputable nodes.
    *   *Result:* A coordinated group of 1,000 Sybils might have high internal trust, but if they only have 2 connections to the outside world, their total influence is mathematically capped by the capacity of those 2 connections.

### 2. The Truth Mechanism: "The Surprisingly Popular" (SP) Algorithm

To prevent a popular false rumor from winning, the system utilizes the algorithm developed by Prelec, Seung, and McCoy (*Nature*, 2017).

We ask two questions for every rumor:

1.  **The Vote:** Is this rumor True or False?
2.  **The Prediction:** What percentage of people do you think will vote "True"?

**The Winning Condition:** The winner is **not** the answer with the most votes. The winner is the answer that is **more popular than the crowd predicted it would be.**

### 3. The User Interface

To make these complex mechanics accessible, the user experience is simplified into a binary "Gauntlet."

*   **The Feed:** Users are presented with a stack of rumors (like flashcards)-just like Tinder.
*   **The Interaction:** For each card, they perform a simple swipe or tap:
    *   **True:** Swipe Right / Tap Green.
    *   **False:** Swipe Left / Tap Red.
*   **The "Prediction" Twist:** Before confirming their vote, a lightweight slider or toggle appears: *"Do you think most people agree with you?"*
    *   Input: `Most Agree` (High Prediction) vs. `Most Disagree` (Low Prediction).
*   **Backend Magic:** This simple UI input is translated into the Bayesian priors required for the SP algorithm.

### 4. The Propagation Mechanism: "The Ripple Protocol"

To prevent false rumors from flash-flooding the network, content does not go to a "Global Feed" immediately. It must "graduate" through concentric circles of trust—similar to how TikTok tests content, but based on **Graph Distance** rather than random sampling.

*   **Stage 1: The Trust Circle:**
    *   When User A posts a rumor, it is only visible to nodes directly connected to User A (people they share edges with).
    *   The Test: The SP Algorithm runs on this small sample.
    *   *Outcome:* If the rumor fails verification here, it is **Shadowbanned** (quarantined). It never leaves the local circle.
*   **Stage 2: The Network Neighbor :**
    *   If Stage 1 passes, the rumor becomes visible to "Friends of Friends."
    *   *The Test:* A larger, slightly less trusted sample votes.
*   **Stage 3: The Global Feed (Viral Status):**
    *   Only if the "Information Gain" remains high across local clusters does it unlock the Global Feed.
    *   *Security Benefit:* A bot farm (Sybil Cluster) is usually isolated. They can post lies and vote "True," but because they have no edges connecting to the honest network, the rumor never crosses from Stage 1 to Stage 2. It effectively rots inside the bot farm.

---

## Implementation

To implement this, the protocol follows these distinct phases:

1.  **The Graph Phase (The "Vouch"):**
    *   New users must be "vouched for" by existing users via a shared link or QR code.
    *   This creates the edges of the graph *A* to *B*.
    *   **Dispute Rule:** If User B is found to be a bot/spammer (via Graph Cuts), User A loses "Trust Points." This forces users to be careful about who they invite.

2.  **The Gauntlet Phase (Betting Lite):**
    *   A rumor is posted to the feed.
    *   Users swipe **True/False**.
    *   Users toggle **"Everyone Agrees"** or **"I'm Controversial"** (Prediction).
    *   *Backend:* "Everyone Agrees" sets *pred = 0.90*. "I'm Controversial" sets *pred = 0.10*.

3.  **The Scoring Phase:**
    *   The system calculates the **Trust-Weighted Vote** (filtering out Sybils via PageRank).
    *   The system runs the **Surprisingly Popular Algorithm** on the weighted votes.
    *   The answer with the highest **Information Gain** (Actual / Predicted) is declared the winner and displayed as "Verified."

---

