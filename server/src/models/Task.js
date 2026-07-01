import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true },
    duration: { type: Number, required: true, min: 0.5 },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    status: {
      type: String,
      enum: ['pending', 'active', 'blocked', 'delayed', 'done'],
      default: 'pending',
    },
    est: { type: Number, default: 0 },
    eft: { type: Number, default: 0 },
    lst: { type: Number, default: 0 },
    lft: { type: Number, default: 0 },
    float: { type: Number, default: 0 },
    isCritical: { type: Boolean, default: false },
    dps: { type: Number, default: 100 },
    estimatedDuration: { type: Number },
    actualStart: { type: Date, default: null },
    actualEnd: { type: Date, default: null },
    handoffLag: { type: Number, default: 0 },
  },
  { timestamps: true }
);

taskSchema.index({ projectId: 1 });
taskSchema.index({ assignee: 1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
