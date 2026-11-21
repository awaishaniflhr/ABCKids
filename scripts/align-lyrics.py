"""Align sing-along lyrics to the recordings, word by word.

1. Transcribe each song with word timestamps (ffmpeg built with whisper.cpp
   and a whisper model, e.g. ggml-small.en.bin):

     ffmpeg -i assets/audio/<song>.mp3 -af "whisper=model=ggml-small.en.bin:
       language=en:max_len=1:destination=<song>.srt:format=srt" -f null -

2. Dump the lyric lines (`npx jest scripts` is not needed: any JSON of
   {"<id>": [{"at": seconds, "text": "..."}]} works) and run:

     python scripts/align-lyrics.py lyrics.json words_dir src/games/poemTimings.js

   `words_dir` holds <song>.srt files named like the audio files.

Each lyric word is matched, in order, to a word whisper heard close to where
that line is expected; words it missed are spread between their neighbours.
The output gives every line a list of word start times.
"""
import json
import os
import re
import sys

SONG_FILES = {
    "1": "abcsong",
    "2": "twinkle_poem",
    "3": "baba_blacksheep",
    "4": "once_caught_fish",
    "5": "wheels_on_bus",
    "6": "down_at_station",
    "7": "nick_nack_paddy",
    "8": "big_ship_sails",
}
DIGITS = "zero one two three four five six seven eight nine ten".split()
# Line starts checked by hand against the word timestamps, where repeated
# words ("round and round", "and off we go") fooled the matcher:
# {song id: {rough line time in lyrics: real start}}.
OVERRIDES = {
    "2": {92.3: 92.0},
    "4": {35.9: 35.0, 122.2: 122.6, 128.2: 129.0},
    "5": {8.9: 8.6, 79.4: 78.3},
    "6": {83.4: 84.0, 103.0: 104.0},
    "7": {4.0: 6.0, 6.3: 7.6, 8.8: 10.0, 11.9: 11.1},
}
SMALL_WORDS = set("a an and the on of in to it my is all we our".split())
WINDOW = 3.5  # seconds a heard word may sit outside its line's expected time


def norm(word):
    word = word.lower().replace("’", "'")
    word = re.sub(r"[^a-z0-9']", "", word)
    if word.isdigit() and int(word) <= 10:
        return DIGITS[int(word)]
    return word


def read_srt(path):
    words = []
    for block in open(path, encoding="utf-8", errors="replace").read().split("\n\n"):
        rows = block.strip().split("\n")
        if len(rows) < 3 or "-->" not in rows[1]:
            continue
        h, m, rest = rows[1].split(" --> ")[0].split(":")
        start = int(h) * 3600 + int(m) * 60 + float(rest.replace(",", "."))
        text = " ".join(rows[2:])
        if text.startswith(("[", "(")) or "♪" in text and len(text) < 3:
            continue
        # "A.B.C" / "H-I-J" style letter runs become separate letters.
        for token in re.split(r"[\s]+", text):
            parts = [p for p in re.split(r"[.\-,]", token) if p]
            if len(parts) > 1 and all(len(norm(p)) == 1 for p in parts):
                step = 0.25
                words += [(start + i * step, norm(p)) for i, p in enumerate(parts)]
            elif norm(token):
                words.append((start, norm(token)))
    return words


def similar(a, b):
    if a == b:
        return 2.0
    if not a or not b or a[0] != b[0]:
        return 0.0
    # cheap edit similarity
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    ratio = 1 - prev[-1] / max(len(a), len(b))
    return 1.0 if ratio >= 0.5 else 0.0


def align(lines, heard, overrides=None):
    overrides = overrides or {}
    # Flatten lyric words with the time window their line allows.
    lyric = []
    for li, line in enumerate(lines):
        nxt = lines[li + 1]["at"] if li + 1 < len(lines) else line["at"] + 6
        for wi, word in enumerate(line["text"].split(" ")):
            lyric.append((li, wi, norm(word), line["at"] - WINDOW, nxt + WINDOW))
    n, m = len(lyric), len(heard)
    gap = -0.2
    score = [[0.0] * (m + 1) for _ in range(n + 1)]
    move = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        score[i][0], move[i][0] = score[i - 1][0] + gap, 1
    for j in range(1, m + 1):
        score[0][j], move[0][j] = score[0][j - 1] + gap, 2
    for i in range(1, n + 1):
        _, _, word, lo, hi = lyric[i - 1]
        for j in range(1, m + 1):
            t, heard_word = heard[j - 1]
            match = similar(word, heard_word) if lo <= t <= hi else 0.0
            best, how = score[i - 1][j] + gap, 1
            if score[i][j - 1] + gap > best:
                best, how = score[i][j - 1] + gap, 2
            if match and score[i - 1][j - 1] + match > best:
                best, how = score[i - 1][j - 1] + match, 3
            score[i][j], move[i][j] = best, how
    times = [None] * n
    i, j = n, m
    while i and j:
        how = move[i][j]
        if how == 3:
            times[i - 1] = heard[j - 1][0]
            i, j = i - 1, j - 1
        elif how == 1:
            i -= 1
        else:
            j -= 1
    matched = sum(t is not None for t in times)
    # Only distinctive words anchor the timing; small words ("the", "on")
    # match too easily in the wrong place.
    for k, (li, _, word, _, _) in enumerate(lyric):
        letters_line = all(len(norm(w)) == 1 for w in lines[li]["text"].split(" "))
        if times[k] is not None and not letters_line and (
            word in SMALL_WORDS or len(word) < 3
        ):
            times[k] = None
    out = []
    previous_end = 0.0
    k = 0
    for li, line in enumerate(lines):
        count = len(line["text"].split(" "))
        anchors = [(w, times[k + w]) for w in range(count) if times[k + w] is not None]
        # Drop anchors that run backwards.
        clean = []
        for w, t in anchors:
            if t > previous_end - 0.05 and (not clean or t > clean[-1][1]):
                clean.append((w, t))
        anchors = clean
        fixed = overrides.get(round(line["at"], 1))
        if fixed is not None:
            anchors = [(0, fixed)] + [a for a in anchors if a[0] > 0 and a[1] > fixed + 0.1]
        elif anchors and anchors[0][0] > 0:
            # Only late anchors: start from the line's rough time rather than
            # guessing backwards from the anchor.
            first_w, first_t = anchors[0]
            start = max(previous_end + 0.05, min(line["at"], first_t - 0.15 * first_w))
            anchors = [(0, start)] + anchors
        if len(anchors) >= 2:
            (w0, t0), (w1, t1) = anchors[0], anchors[-1]
            pace = min(0.6, max(0.15, (t1 - t0) / max(1, w1 - w0)))
        else:
            pace = 0.35
        if not anchors:
            anchors = [(0, max(line["at"], previous_end + 0.2))]
        word_times = []
        for w in range(count):
            before = [a for a in anchors if a[0] <= w]
            after = [a for a in anchors if a[0] >= w]
            if before and after and before[-1][0] != after[0][0]:
                (wa, ta), (wb, tb) = before[-1], after[0]
                word_times.append(ta + (tb - ta) * (w - wa) / (wb - wa))
            elif before and after:
                word_times.append(before[-1][1])
            elif before:
                word_times.append(before[-1][1] + pace * (w - before[-1][0]))
            else:
                word_times.append(after[0][1] - pace * (after[0][0] - w))
        word_times[0] = max(word_times[0], previous_end + 0.05)
        for w in range(1, count):
            word_times[w] = max(word_times[w], word_times[w - 1] + 0.08)
        out.append([round(t, 2) for t in word_times])
        previous_end = word_times[-1]
        k += count
    return out, matched, n


def main(lyrics_path, words_dir, out_path):
    lyrics = json.load(open(lyrics_path, encoding="utf-8"))
    result = {}
    for song_id, lines in lyrics.items():
        heard = []
        for name in os.listdir(words_dir):
            if name.startswith(SONG_FILES[song_id] + ".") and name.endswith(".srt"):
                heard += read_srt(os.path.join(words_dir, name))
        heard.sort()
        timings, matched, total = align(lines, heard, OVERRIDES.get(song_id))
        result[song_id] = timings
        print(f"song {song_id}: matched {matched}/{total} words")
    body = json.dumps(result, separators=(",", ":"))
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(
            "// Generated by scripts/align-lyrics.py: start time (seconds) of every\n"
            "// lyric word, line by line, in the same order as POEM_LYRICS.\n"
            "// prettier-ignore\n"
            f"export const POEM_TIMINGS = {body};\n"
        )


if __name__ == "__main__":
    main(*sys.argv[1:4])
