from flask import Flask, request, jsonify, render_template
import jieba
from whoosh.analysis import Tokenizer, Token
from whoosh.index import create_in, open_dir
from whoosh.fields import *
from jieba.analyse import ChineseAnalyzer
import os
import logging
import time
import re

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers import BitsAndBytesConfig
from docx import Document  # 使用 python-docx 处理 docx 文件

from whoosh.qparser import QueryParser
from jieba import posseg
from whoosh.query import Term

app = Flask(__name__)
from flask_cors import CORS
CORS(app)  

model_path = r"C:\models\Qwen2.5-7B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    model_path,
    torch_dtype="auto",
    device_map="auto"
).eval()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChineseTokenizer(Tokenizer):
    def __call__(self, value, positions=False, chars=False, keeporiginal=False, removestops=True, start_pos=0, start_char=0, mode='', **kwargs):
        t = Token(positions, chars, removestops=removestops, mode=mode, **kwargs)
        seglist = jieba.cut(value)
        for w in seglist:
            t.original = t.text = w
            t.boost = 1.0
            if positions:
                t.pos = start_pos + value.find(w)
            if chars:
                t.startchar = start_char + value.find(w)
                t.endchar = start_char + value.find(w) + len(w)
            yield t

analyzer = ChineseAnalyzer()
analyzer.tokenizer = ChineseTokenizer()

# 定义Schema
schema = Schema(
    title=TEXT(analyzer=analyzer, stored=True),
    content=TEXT(analyzer=analyzer, stored=True),
    path=ID(stored=True)
)

# ============ DOCX 文本提取 ============

def extract_text_from_docx(docx_path):
    """提取 DOCX 文本"""
    try:
        doc = Document(docx_path)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"  # 每段文本后加换行符
        return text
    except Exception as e:
        logger.error(f"读取 {docx_path} 失败: {str(e)}")
        return ""

def extract_text_from_directory(directory):
    """遍历目录提取 DOCX 文件的文本"""
    docx_texts = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.docx'):
                docx_path = os.path.join(root, file)
                logger.info(f"正在处理: {docx_path}")
                text = extract_text_from_docx(docx_path)
                if text:
                    docx_texts.append({
                        'filename': file,   # 作为title
                        'text': text,       # 作为content
                        'path': docx_path
                    })
    return docx_texts

def create_index(directory, index_dir):
    """创建索引（添加已存在检查）"""
    if not os.path.exists(index_dir):
        os.makedirs(index_dir)
    
    if not os.listdir(index_dir):
        ix = create_in(index_dir, schema)
        writer = ix.writer()
        documents = extract_text_from_directory(directory)
        for doc in documents:
            writer.add_document(
                title=doc['filename'],
                content=doc['text'],
                path=doc['path']
            )
        writer.commit()
        logger.info(f"已创建新索引，包含 {len(documents)} 个文档")
    else:
        logger.info("检测到已有索引，跳过创建")


# ============ 搜索相关函数 ============

def search_files(question, index_dir, num_results=3):
    """
    根据内容字段进行搜索，用于查找与问题相关的文档
    返回相关文档的 path、title 和 content。
    """
    ix = open_dir(index_dir)
    with ix.searcher() as searcher:
        seg_list = jieba.cut_for_search(question)
        query_str = " OR ".join(seg_list)
        query = QueryParser("content", ix.schema).parse(query_str)
        results = searcher.search(query, limit=num_results)
        return [
            {
                'path': hit['path'],
                'title': hit['title'],
                'content': hit['content']
            }
            for hit in results
        ]

def extract_place_names(question):
    """
    提取问题中的地名，返回地名列表。
    """
    # 使用jieba的词性标注来提取地名（假设地名是ns词性）
    place_names = []
    words = posseg.cut(question)
    for word, flag in words:
        if flag == 'ns':  # 'ns' 是地名的标记
            place_names.append(word)
    return place_names

def search_title(question, index_dir, num_results=1, score_threshold=50):
    """
    根据标题字段进行搜索，用于查找与问题相关的标题。
    强调地名和关键词的准确性，只有标题同时包含地名和提问中的关键词才会被选中。
    """
    # 假设我们有一个停用词列表，可以从文件或其他来源加载
    stopwords = set(["的", "和", "是", "在", "有", "为", "等"])  # 示例停用词
    
    ix = open_dir(index_dir)
    with ix.searcher() as searcher:
        # 提取问题中的地名
        place_names = extract_place_names(question)
        
        # 提取问题中的关键词，并去除停用词
        seg_list = jieba.cut_for_search(question)
        filtered_words = [word for word in seg_list if word not in stopwords]
        
        # 如果去停用词后的关键词为空，返回空结果
        if not filtered_words:
            return []

        query_str = " OR ".join(filtered_words)  # 仅保留有效的关键词
        print("查询关键词：", query_str)
        
        # 构建查询条件：地名和关键词同时出现在标题中
        query_parts = []
        
        # 如果有地名，构建地名的查询条件
        if place_names:
            place_query = " AND ".join([f"title:{place}" for place in place_names])
            query_parts.append(place_query)
        
        # 如果有关键词，构建关键词的查询条件
        if query_str:
            query_parts.append(f"title:({query_str})")
        
        # 合并所有的查询条件，确保同时包含地名和关键词
        query_str = " AND ".join(query_parts)
        query = QueryParser("title", ix.schema).parse(query_str)
        
        # 执行查询并返回最多1个符合条件的结果
        results = searcher.search(query, limit=num_results)

        # 过滤出score大于阈值的结果
        filtered_results = [
            {
                'path': hit['path'],
                'title': hit['title'],
                'score': hit.score
            }
            for hit in results if hit.score >= score_threshold
        ]
        
        return filtered_results


def get_summary_if_relevant(title_info, summary_dir, score_threshold=50.0):
    """
    如果标题搜索结果分值超过阈值，则读取对应摘要文件。
    文件名规则假设为: "xxx.docx" -> 在 summary_dir 中有 "xxx_sum.txt"。
    """
    if not title_info:
        return None

    if title_info['score'] < score_threshold:
        return None
    
    base_title = title_info['title']
    if base_title.lower().endswith(".docx"):
        base_title = base_title[:-5]

    summary_file = os.path.join(summary_dir, f"{base_title}_sum.txt")
    if os.path.exists(summary_file):
        try:
            with open(summary_file, 'r', encoding='utf-8') as f:
                summary_text = f.read()
                return summary_text
        except Exception as e:
            logger.error(f"读取摘要文件出错: {str(e)}")
            return None
    else:
        logger.info(f"未找到摘要文件: {summary_file}")
        return None

# ============ 分段和匹配相关 ============

def split_into_paragraphs(text, min_length=30):
    """将文本按句号、问号和感叹号后拆分为段落"""
    paragraphs = re.split(r'[。！？]\s*', text)
    paragraphs = [p.strip() for p in paragraphs if len(p.strip()) >= min_length]
    return paragraphs

def simple_overlap_score(paragraph, question):
    """通过词重叠计算段落与问题的相关性"""
    para_tokens = set(jieba.cut_for_search(paragraph))
    ques_tokens = set(jieba.cut_for_search(question))
    return len(para_tokens.intersection(ques_tokens))

def extract_top_paragraphs(doc_content, question, threshold=3):
    """
    提取与问题最相关的段落，只有当段落的相关性分数高于阈值时才会被选取。
    
    参数:
    - doc_content: 文档内容（文本）
    - question: 提问的内容
    - threshold: 相关性得分阈值，只有分数大于该值的段落才会被选取

    返回:
    - 被筛选出的相关段落文本，多个段落用 "\n\n" 分隔
    """
    # 将文档内容按段落拆分
    paragraphs = split_into_paragraphs(doc_content)
    if not paragraphs:
        return ""

    # 用来保存段落及其得分的列表
    scored_paragraphs = []

    # 计算每个段落的相关性分数
    for p in paragraphs:
        score = simple_overlap_score(p, question)
        scored_paragraphs.append((p, score))

    # 根据得分从高到低排序
    scored_paragraphs.sort(key=lambda x: x[1], reverse=True)

    # 筛选出得分高于阈值的段落
    selected_paragraphs = [sp[0] for sp in scored_paragraphs if sp[1] >= threshold]

    #print("selected_paragraphs:", selected_paragraphs)

    # 返回筛选出的段落，段落之间用 "\n\n" 分隔
    return "\n\n".join(selected_paragraphs)


# ============ 标题和内容去重，并合并回答 ============

def search_title_and_content(question, index_dir, summary_dir, num_results=3, threshold=3):
    """
    1) 查询标题判断是否与问题强相关（若相关则返回摘要）。
    2) 如果title相关文档存在，则排除该文档的内容相关搜索，避免重复。
    3) 返回最多1个符合条件的标题相关摘要和内容相关匹配的段落。
    """
    # 查询标题，获取最多1个结果
    title_results = search_title(question, index_dir, num_results=1)
    
    # 获取标题摘要
    title_summaries = []
    for title_result in title_results:
        title_summary = get_summary_if_relevant(title_result, summary_dir)
        title_summaries.append({
            'title_info': title_result,  # title_info 包含每个标题的信息
            'title_summary': title_summary
        })

    title_doc_paths = [result['title_info']['path'] for result in title_summaries]

    # 内容相关搜索
    all_content_results = search_files(question, index_dir, num_results=num_results)

    # 排除标题相关的文档
    filtered_results = [doc for doc in all_content_results if doc['path'] not in title_doc_paths]

    for doc in filtered_results:
        doc['content'] = extract_top_paragraphs(doc['content'], question, threshold=threshold)
        print("内容相关文档：", doc['title'])
        print("内容相关段落：", doc['content'])


    return {
        'title_summaries': title_summaries,  # 返回最多1个标题相关摘要
        'content_matches': filtered_results
    }


# ============ 大模型生成最终回答 ============

def generate_answer(question, search_result, max_context_length=30000):
    """
    使用大语言模型生成最终回答，包括摘要和内容相关回答。
    返回包括摘要、大模型回答、标题相关文件的标题和内容相关文件的标题。
    """
    start_time = time.time()

    # 标题摘要部分
    title_summaries = search_result['title_summaries']
    
    # 构建标题部分的内容
    title_related=""
    title_related_str = ""
    for summary in title_summaries:
        title_info = summary['title_info']
        title_summary = summary['title_summary']
        title_related += f"{title_info['title']}\n"
        title_related_str += f"{title_summary}\n\n"

    # 构建内容相关部分的上下文
    context = ""
    total_length = 0

    # 内容相关部分
    for doc in search_result['content_matches']:
        content_text = doc['content']
        if total_length + len(tokenizer.encode(content_text)) > max_context_length:
            break
        context += f"内容相关文档：\n{doc['title']}\n{content_text}\n\n"
        total_length += len(tokenizer.encode(content_text))

    # 如果没有内容相关段落，则返回提示
    if not context:
        return "未找到相关内容生成回答"

    prompt = f"""
        你是一名营商政策专家。请根据以下问题和上下文，上下文可能包括多个内容相关文档的段落，请对它们进行结合并生成准确且完备的回答。\n
        特别注意：如果给出的上下文不足以支持问题的回答，请简要概括上下文，然后回答资料不足，无法回答。\n

        问题: {question}

        上下文:
        {context}
    """

    # 使用大模型生成回答
    messages = [
        {"role": "system", "content": "你是一名营商政策专家。"},
        {"role": "user", "content": prompt}
    ]
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )

    model_inputs = tokenizer([text], return_tensors="pt").to(model.device)

    generated_ids = model.generate(
        **model_inputs,
        max_new_tokens=512
    )
    generated_ids = [
        output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
    ]

    response = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]

    # 输出时间
    end_time = time.time()
    elapsed_time = end_time - start_time
    logger.info(f"回答生成时间: {elapsed_time:.2f} 秒")

    # 获取内容相关文档标题
    content_related_str = "；".join([doc['title'] for doc in search_result['content_matches']])

    return {
        "title_summary": title_related_str,
        "model_answer": f"\n{response}\n\n",
        "title_related": title_related,
        "content_related": content_related_str
    }



@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_answer', methods=['POST'])
def generate_answer_api():
    try:
        # 获取用户请求的问题
        data = request.json
        question = data.get('question', '').strip()
        if not question:
            return jsonify({"error": "问题不能为空"}), 400
        
        # 获取标题摘要和内容相关段落
        combined_result = search_title_and_content(
            question, index_dir='indexdir', summary_dir='C:/yingshang/summary', num_results=3, threshold=3
        )

        # 生成最终的答案
        answer = generate_answer(question, combined_result)
        print(f"生成的答案：{answer}")  # 这里确保输出答案，查看后端是否正常生成答案
        return jsonify({"answer": answer})

    except Exception as e:
        logger.error(f"错误: {str(e)}")
        return jsonify({"error": str(e)}), 500



# ======== 启动 Flask 应用 =========
if __name__ == "__main__":
    index_dir = "indexdir"
    directory_path = r"C:\yingshang\拆分2\拆分2"
    summary_dir = r"C:\yingshang\summary"

    # 创建索引
    create_index(directory_path, index_dir)
    app.run(debug=False, host='0.0.0.0', port=5000)



