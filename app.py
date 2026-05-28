from flask import Flask, render_template, request, jsonify
import spacy
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static"),
)

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    raise RuntimeError(
        "spaCy model not found. Run: python -m spacy download en_core_web_sm"
    )


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/tokenize", methods=["POST"])
def tokenize():
    text = request.json.get("text", "").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400
    doc = nlp(text)
    tokens = [
        {
            "text": token.text,
            "idx": token.idx,
            "is_punct": token.is_punct,
            "is_space": token.is_space,
            "is_stop": token.is_stop,
            "is_alpha": token.is_alpha,
            "is_digit": token.is_digit,
        }
        for token in doc
    ]
    return jsonify({"tokens": tokens, "count": len(tokens)})


@app.route("/api/sentences", methods=["POST"])
def sentences():
    text = request.json.get("text", "").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400
    doc = nlp(text)
    sents = [
        {
            "text": sent.text,
            "start": sent.start_char,
            "end": sent.end_char,
            "token_count": len(sent),
        }
        for sent in doc.sents
    ]
    return jsonify({"sentences": sents, "count": len(sents)})


@app.route("/api/pos", methods=["POST"])
def pos():
    text = request.json.get("text", "").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400
    doc = nlp(text)
    tokens = [
        {
            "text": token.text,
            "pos": token.pos_,
            "tag": token.tag_,
            "explanation": spacy.explain(token.pos_) or spacy.explain(token.tag_) or "",
        }
        for token in doc
        if not token.is_space
    ]
    return jsonify({"tokens": tokens})


@app.route("/api/ner", methods=["POST"])
def ner():
    text = request.json.get("text", "").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400
    doc = nlp(text)
    entities = [
        {
            "text": ent.text,
            "label": ent.label_,
            "start": ent.start_char,
            "end": ent.end_char,
            "explanation": spacy.explain(ent.label_) or "",
        }
        for ent in doc.ents
    ]
    return jsonify({"entities": entities, "text": text})


@app.route("/api/dependency", methods=["POST"])
def dependency():
    text = request.json.get("text", "").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400
    doc = nlp(text)
    deps = [
        {
            "text": token.text,
            "dep": token.dep_,
            "head": token.head.text,
            "head_pos": token.head.pos_,
            "pos": token.pos_,
            "children": [c.text for c in token.children],
            "explanation": spacy.explain(token.dep_) or "",
        }
        for token in doc
        if not token.is_space
    ]
    return jsonify({"dependencies": deps})


@app.route("/api/lemma", methods=["POST"])
def lemma():
    text = request.json.get("text", "").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400
    doc = nlp(text)
    lemmas = [
        {
            "text": token.text,
            "lemma": token.lemma_,
            "pos": token.pos_,
            "changed": token.text.lower() != token.lemma_.lower(),
        }
        for token in doc
        if not token.is_space and not token.is_punct
    ]
    return jsonify({"lemmas": lemmas})


@app.route("/api/stopwords", methods=["POST"])
def stopwords():
    text = request.json.get("text", "").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400
    doc = nlp(text)
    words = [
        {"text": token.text, "is_stop": token.is_stop, "is_punct": token.is_punct}
        for token in doc
        if not token.is_space
    ]
    stop_count = sum(1 for t in doc if t.is_stop)
    content_count = sum(1 for t in doc if not t.is_stop and not t.is_space and not t.is_punct)
    return jsonify({"words": words, "stop_count": stop_count, "content_count": content_count})


@app.route("/api/similarity", methods=["POST"])
def similarity():
    text1 = request.json.get("text1", "").strip()
    text2 = request.json.get("text2", "").strip()
    if not text1 or not text2:
        return jsonify({"error": "Two texts are required"}), 400
    doc1 = nlp(text1)
    doc2 = nlp(text2)
    try:
        sim = float(doc1.similarity(doc2))
    except Exception:
        sim = 0.0
    label = (
        "Very High" if sim >= 0.9 else
        "High" if sim >= 0.75 else
        "Moderate" if sim >= 0.5 else
        "Low" if sim >= 0.25 else
        "Very Low"
    )
    return jsonify({"similarity": round(sim, 4), "percentage": round(sim * 100, 2), "label": label})


@app.route("/api/full-pipeline", methods=["POST"])
def full_pipeline():
    text = request.json.get("text", "").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400
    doc = nlp(text)
    word_tokens = [t for t in doc if not t.is_space]
    return jsonify({
        "stats": {
            "char_count": len(text),
            "token_count": len(word_tokens),
            "sentence_count": len(list(doc.sents)),
            "entity_count": len(doc.ents),
            "stop_word_count": sum(1 for t in word_tokens if t.is_stop),
            "unique_lemmas": len({t.lemma_ for t in word_tokens}),
        },
        "entities": [
            {"text": e.text, "label": e.label_, "explanation": spacy.explain(e.label_) or ""}
            for e in doc.ents
        ],
        "sentences": [s.text for s in doc.sents],
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
