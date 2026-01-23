import os
from typing import Annotated, List, TypedDict

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph.message import add_messages
from dotenv import load_dotenv

load_dotenv()

class ChefState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    recipe_context: str
    
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7, streaming=True)

def chef_node(state: ChefState):
    recipe = state.get("recipe_context", "no recipe provided")
    messages = state["messages"]

    system_prompt = f"""
    You are SnapCook, a friendly, encouraging, Michelin-star sous-chef.
    
    YOUR CURRENT TASK:
    The user is cooking the following recipe. Guide them through it step-by-step.
    
    RECIPE CONTEXT:
    {recipe}
    
    GUIDELINES:
    1. If this is the start of the conversation, welcome them and summarize the first step.
    2. Keep answers concise (2-3 sentences max) unless asked for details.
    3. If the user asks something unrelated to cooking, politely steer them back to the recipe.
    4. Be encouraging! Use emojis like 🍳, 👨‍🍳, 🔥.
    """
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="messages")
    ])

    chain = prompt | llm
    response = chain.invoke({"messages": messages})

    return {"messages": [response]}

builder = StateGraph(ChefState)

builder.add_node("chef", chef_node)
builder.set_entry_point("chef")
builder.add_edge("chef", END)

memory = MemorySaver()

graph = builder.compile(checkpointer=memory)

async def run_agent(thread_id: str, user_input: str, recipe_context: str = None):
    config = {"configurable": {"thread_id": thread_id}}

    inputs = {"messages": [HumanMessage(content=user_input)]}

    if recipe_context:
        inputs["recipe_context"] = recipe_context
        
    async for msg, metadata in graph.astream(inputs, config, stream_node="messages"):
        if msg.content:
            yield msg.content