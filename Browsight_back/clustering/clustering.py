import requests
import pandas as pd
import re
from sentence_transformers import SentenceTransformer
from umap import UMAP
from hdbscan import HDBSCAN
from bertopic import BERTopic
from kiwi import create_vectorizer
from sentence_transformers import util
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import matplotlib.font_manager as fm
import sys
import json


def preprocess(text):
    text = text.replace("\n", " ")
    text = re.sub(r'[^ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def datasetLoader():
    with open('temp.json', 'r', encoding='utf8') as f:
        data = json.load(f)
    data = [preprocess(d['DATA_STR']) for d in data]
    return data

def modelLoader(dataset): # 가져온 코드
    embedding_model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    embeddings = embedding_model.encode(dataset, show_progress_bar=True)
    umap_model = UMAP(n_neighbors=15, n_components=5, min_dist=0.0, metric='cosine', random_state=42)
    hdbscan_model = HDBSCAN(min_cluster_size=40, metric='euclidean', cluster_selection_method='eom', prediction_data=True)
    vectorizer = create_vectorizer()
    topic_model = BERTopic(
        embedding_model=embedding_model,
        umap_model=umap_model,
        hdbscan_model=hdbscan_model,
        vectorizer_model=vectorizer,
        top_n_words=4,
        verbose=True
    )

    topics, probs = topic_model.fit_transform(dataset, embeddings)
    return topic_model, topics, probs, embedding_model, embeddings

def similarity(user_key_cd, embedding_model, embeddings, topics, dataset):
    cluster_similarities = []
    resp = requests.get('http://127.0.0.1:3000/ticket').json()
    tickets = [ticket for ticket in resp if ticket['USER_KEY_CD'] == user_key_cd and ticket['STATUS_FLG'] == 1]
    
    for i, ticket in enumerate(tickets):
        task = ticket['CONTENT_STR']
        title = ticket['TITLE_STR']
        task_embeddings = embedding_model.encode(task)
        for topic in set(topics):
            topic_indices = [i for i, t in enumerate(topics) if t == topic]
            topic_texts = [dataset[i] for i in topic_indices]
            topic_embeddings = embeddings[topic_indices]
            similarities = util.pytorch_cos_sim(topic_embeddings, task_embeddings)
            similarities_array = np.array(similarities)
            mean_similarity = round(np.mean(similarities_array), 5)
            cluster_similarities.append((i+1, topic, title, mean_similarity))

    df_results = pd.DataFrame(cluster_similarities, columns=["Ticket", "Cluster", "Ticket Name", "Mean Similarity"])
    return df_results

def main(user_key_cd):
    dataset = datasetLoader()
    topic_model, topics, probs, embedding_model, embeddings = modelLoader(dataset)
    topic_info = topic_model.get_topic_info()
    df_results = similarity(user_key_cd, embedding_model, embeddings, topics, dataset)
    
    # Convert topic_info to a dictionary
    topic_info_dict = topic_info.set_index('Topic').to_dict()['Representation']

    # Add Representation column to df_results
    df_results['Representation'] = df_results['Cluster'].map(topic_info_dict)
    df_results['Mean Similarity'] = df_results['Mean Similarity'].astype(str).astype(float)
    result = df_results.to_dict(orient='records')
    return result

if __name__ == "__main__":
    if len(sys.argv) > 1:
        user_key_cd = sys.argv[1]
        result = main(user_key_cd)
        with open('temp2.json', 'w', encoding='UTF-8') as file:
            file.write(json.dumps(result, ensure_ascii=False))
    else:
        print(json.dumps({"error": "Not enough data provided"}, ensure_ascii=False))
