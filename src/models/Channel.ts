import mongoose from "mongoose";

const ChannelSchema = new mongoose.Schema({
  nombre: String,
  urlOrigen: String,
  estado: Boolean,
});

export default mongoose.model("Channel", ChannelSchema);